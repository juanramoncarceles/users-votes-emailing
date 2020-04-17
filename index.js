require('dotenv').config();

const fs = require('fs');
const fsPromises = fs.promises;
const readline = require('readline');
const {google} = require('googleapis');

const emailDataManagement = require('./emailDataManagement');

const express = require('express');
// Express initialization.
const app = express();



// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';


/**
 * Creates a promise with a question. Promise will be resolved after question is answered.
 * TODO: Place the readline interface inside the function instead that as a param.
 * @param {Interface} rl readline.createInterface()
 * @param {string} q The question to show in the terminal.
 */
function WaitQuestion(rl, q) {
  let response;
  rl.setPrompt(q);
  rl.prompt();
  return new Promise((resolve , reject) => {
    try {
      rl.on('line', (userInput) => {
          response = userInput;
          rl.close();
      });
      rl.on('close', () => {
          resolve(response);
      });
    } catch (err) {
      reject('Error while getting an answer: ' + err);
    }
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * returns the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const code = await WaitQuestion(rl, 'Enter the code from that page here: ');
  try {
    if (!code) throw Error('No code was provided.');
    // This will provide an object with the access_token and refresh_token.
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    // Store the token to disk for later program executions.
    fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
      if (err) return console.error(err);
      console.log('Token stored to', TOKEN_PATH);
    });
  } catch (err) {
    console.error('Error while trying to retrieve access token.');
  }
}


/**
 * Reads the contents of the credentials file and creates an OAuth2 client.
 * If unsuccesfull it returns an object with the error message.
 */
async function authorize() {
  let credentials;  
  try {
    // Load client secrets from a local file.
    const content = await fsPromises.readFile('credentials.json', 'utf-8');
    credentials = JSON.parse(content);
  } catch (err) {
    return { error: true, msg: err };
  }
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  try {
    // Check if we have previously stored a token.
    const content = await fsPromises.readFile(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(content));
  } catch (err) {
    if (err) {
      getNewToken(oAuth2Client);
      return { error: true, msg: err };
    }
  }
  if (oAuth2Client == null) {
    return { error: true, msg: 'Authentication failed. Empty authentication authenticated Google OAuth client object.' }
  }
  return oAuth2Client;
}


const sheets = google.sheets('v4');

/**
 * Gets the titles from the sheets of a Google spreadsheet.
 */
async function getSpreadsheetSheetsTitles() {
  const oAuth2Client = await authorize();
  if (oAuth2Client == null || oAuth2Client.error ) {
    return Promise.reject(oAuth2Client.msg);
  }
  const request = {
    spreadsheetId: '1pqQS57mgY8VzqUmok9MXLiSsY7jAWM6bLZqFyB6NfCA',
    //ranges: [],  // No content requested.
    includeGridData: false,
    fields: 'sheets.properties',
    auth: oAuth2Client,
  };
  try {
    const response = (await sheets.spreadsheets.get(request)).data;
    const sheetsTitles = [];
    for (let i = 0; i < response.sheets.length; i++) {
      sheetsTitles.push(response.sheets[i].properties.title);
    }
    return sheetsTitles;
  } catch (err) {
    return Promise.reject(err);
  }
}


/**
 * Gets the data from the Google Sheet and returns the content to send.
 * @param {String} version The name of the sheet.
 */
async function listBugsData(version) {
  const auth = await authorize();
  const request = {
    spreadsheetId: '1pqQS57mgY8VzqUmok9MXLiSsY7jAWM6bLZqFyB6NfCA',
    range: version
  };
  const sheets = google.sheets({version: 'v4', auth});
  try {
    const response = await sheets.spreadsheets.values.get(request);
    const googleSheetsData = response.data.values;
    if (googleSheetsData.length) {
      return googleSheetsData;
    } else {
      console.log('No data found.');
    }
  } catch (err) {
    console.error('The API returned an error: ' + err);
  }
}


/**
 * Returns the HTML page as a string.
 * @param {String Array} versions For example: ["2.5", "2.6", "2.7"]
 */
function createPageTemplate(versions) {
  const versionsOptions = versions.map(v => `<option value="${v}">${v}</option>`).join('');
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="style.css">
      <title>User Votes Emailing</title>
      <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300&display=swap" rel="stylesheet">
    </head>
    <body>
      <div class="header">
        <h1>User Votes Emailing</h1>
        <div class="controls">
          <form class="version-form">
            <label for="versionSelect">Version </label>
            <select name="version" id="versionSelect">
                <option value="">- none -</option>
                ${versionsOptions}
            </select>
          </form>
          <button id="sendEmailsBtn" class="button">Send emails</button>
        </div>
        <div id="emailingDetails" class="emailing-details"></div>
      </div>
      <div class="main-container">
        <div id="emailsPreview"></div>
      </div>
      <script type="text/javascript" src="./client.js"></script>
    </body>
    </html>`;
}


/**
 * 
 * @param {Object} mailOptions 
 */
async function sendEmails(mailOptions) {
  console.log(mailOptions);
  // TODO: nodemailer.sendMails(mailOptions);
}


/**
 * Global variable to store the emails content to be send by Nodemailer.
 * @type {MailOptions[]} Array of Nodemailer mailOptions objects.
 */
let emailsContent;


// Required to parse URL-encoded bodies as sent by HTML forms.
//app.use(express.urlencoded());

// Required to parse JSON bodies as sent by API clients.
app.use(express.json());

// Required to serve static files like front end js and css.
app.use(express.static('public'));

app.listen(3000, function() {
    console.log('Listening on port 3000.');
  });

app.get('/', function(req, res) {
    getSpreadsheetSheetsTitles().then(titles => {
      const pageTemplate = createPageTemplate(titles);
      res.send(pageTemplate);
    }, rej => {
      //console.log('Rejected response: ', rej);
      res.status(500).send('<strong>Internal Server Error:</strong> ' + rej.toString());
    });
  });


// Access the parse results as request.body
app.post('/emails/preview', (request, response) => {
    // Obtain the selected version to get the data. 
    const ver = request.body.version;
    console.log('Selected version: ', ver); // for example "2.7.1"
    listBugsData(ver).then(bugsData => {
      if (bugsData.length > 0) {
        // Format it to mailOptions objects for nodemailer.
        emailsContent = emailDataManagement.createMailOptions('Ramon <ramon@asuni.com>', ver, bugsData, ''); // Last one will be in the request.body.url
        response.json(emailsContent);
      } else {
        response.json(null);
      }
    }, rejected => {
      console.log('Fetching bugs data failed ', rejected);
    });
  });


app.post('/emails/send', (request, response) => {
  const order = request.body.order;
  console.log(order);
  // sendEmails(emailsContent).then(resolved => {
  //   // send the succes to remove the waiting.
  //   response.json({ status: 'success' });
  // }, rejected => {
  //   // send the error to remove the waiting.
  //   response.json({ status: 'error' });
  // });
});
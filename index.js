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


// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), listData);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

async function testAuthorize() {
  let credentials;  
  try {
    // Load client secrets from a local file.
    const content = await fsPromises.readFile('credentials.json', 'utf-8');
    credentials = JSON.parse(content);
  } catch (err) {
    return console.log('Error loading client secret file:', err);
  }
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  try {
    // Check if we have previously stored a token.
    const content = await fsPromises.readFile(TOKEN_PATH, 'utf-8');
    oAuth2Client.setCredentials(JSON.parse(content));
  } catch (err) {
    if (err) return await getNewToken2(oAuth2Client, callback);
    //if (err) console.log(err);
  }
  if (oAuth2Client == null) {
    throw Error('authentication failed');
  }
  return oAuth2Client;
}


/**
 * Get and store new token after prompting for user authorization, and then
 * returns the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 */
async function getNewToken2(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      return oAuth2Client;
    });
  });
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


/**
 * Gets the data from the Google Sheet and prepares it to send.
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1pqQS57mgY8VzqUmok9MXLiSsY7jAWM6bLZqFyB6NfCA',
    range: 'test1' // versionData.version
  }, (err, res) => {
    if (err) {
      return console.log('The API returned an error: ' + err);
    }
    const googleSheetsData = res.data.values;
    if (googleSheetsData.length) {
      console.log(googleSheetsData);
      // const readline = require('readline').createInterface({
      //   input: process.stdin,
      //   output: process.stdout
      // });
      // // Format it to mailOptions objects for nodemailer:
      // const mailOptions = emailDataManagement.createMailOptions('Ramon <ramon@asuni.com>', versionData.version, googleSheetsData, versionData.url);
      // readline.question(`${console.log(mailOptions)} \nIs this information right? Enter 'y' to confirm and send emails or any other key to cancel: `, (input) => {
      //   if (input === 'y') {
      //     console.log("Emails are being sent.");
      //     // Here logic to send emails:
      //     nodemailer.sendMails(mailOptions);
      //   } else {
      //     console.log("Process aborted.");
      //   }
      //   readline.close();
      // });
    } else {
      console.log('No data found.');
    }
  });
}

const sheets = google.sheets('v4');

async function getSpreadsheetSheetsTitles() {
  const auth = await testAuthorize();
  const request = {
    spreadsheetId: '1pqQS57mgY8VzqUmok9MXLiSsY7jAWM6bLZqFyB6NfCA',
    //ranges: [],  // No content requested.
    includeGridData: false,
    fields: 'sheets.properties',
    auth: auth,
  };
  try {
    const response = (await sheets.spreadsheets.get(request)).data;
    const sheetsTitles = [];
    for (let i = 0; i < response.sheets.length; i++) {
      sheetsTitles.push(response.sheets[i].properties.title);
    }
    return sheetsTitles;
  } catch (err) {
    console.error(err);
  }
}



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
      console.log(rej);
    });
  });

// Access the parse results as request.body
app.post('/', function(request, response){
    // Obtain the selected version to get the data. 
    const ver = request.body.version;
    console.log('Selected version: ', ver); // for example "2.7.1"
    listBugsData(ver).then(bugsData => {
      // Format it to mailOptions objects for nodemailer.
      const emailsContent = emailDataManagement.createMailOptions('Ramon <ramon@asuni.com>', ver, bugsData, ''); // Las one will be in the request.body.url
      //console.log(emailsContent);
      response.json(emailsContent);
    }, rejected => {
      console.log('Fetching bugs data failed ', rejected);
    });
  });


/**
 * Gets the data from the Google Sheet and returns the content to send.
 * @param {String} version The name of the sheet.
 */
async function listBugsData(version) {
  const auth = await testAuthorize();
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

// Put this to be called after confirmation
// nodemailer.sendMails(mailOptions);

/**
 * Returns the HTML page as a string.
 * @param {String Array} versions For example: ["2.5", "2.6", "2.7"]
 */
function createPageTemplate(versions) {
  const versionsOptions = versions.map(v => `<option value="${v}">${v}</option>`).join('');
  return pageTemplate = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="style.css">
      <title>User Votes Emailing</title>
    </head>
    <body>
      <div class="header">
        <h1>Emails to be send</h1>
        <div class="controls">
          <form>
            <label for="versionSelect">Choose a version:</label>
            <select name="version" id="versionSelect">
                <option value="">--Choose a version--</option>
                ${versionsOptions}
            </select>
          </form>
          <button id="sendEmailsBtn">Send emails</button>
        </div>
      </div>
      <div class="main-container">
        <div id="emailsPreview" class="emails-list-container"></div>
      </div>
      <script type="text/javascript" src="./client.js"></script>
    </body>
    </html>`;
}
require('dotenv').config();

const fs = require('fs');
const fsPromises = fs.promises;
const readline = require('readline');
const {google} = require('googleapis');
const config = require('./config');
const nodemailer = require('./nodemailer');

const emailDataManagement = require('./emailDataManagement');

const express = require('express');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// For only read access use 'https://www.googleapis.com/auth/spreadsheets.readonly'

/**
 * The file token.json stores the user's access and refresh tokens, and is
 * created automatically when the authorization flow completes for the first
 * time.
 */
const TOKEN_PATH = 'token.json';

/**
 * Google Sheets V4 API utility object.
 */
const sheets = google.sheets('v4');

/**
 * To store an object with 'title' and 'sheetId' of the last requested sheet in the spreadsheet.
 */
let currentSheetData;

/**
 * Creates a promise with a question. Promise will be resolved after question is answered.
 * TODO: Place the readline interface inside the function instead that as a param.
 * @param {Interface} rl readline.createInterface()
 * @param {string} q The question to show in the terminal.
 */
function waitQuestion(rl, q) {
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
  const code = await waitQuestion(rl, 'Enter the code from that page here: ');
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


/**
 * Gets data from the sheets of a Google spreadsheet.
 * @returns Array of objects with title and sheetId.
 */
async function getSpreadsheetSheetsProps() {
  const oAuth2Client = await authorize();
  if (oAuth2Client == null || oAuth2Client.error ) {
    return Promise.reject(oAuth2Client.msg);
  }
  const request = {
    spreadsheetId: config.spreadSheetId,
    //ranges: [],  // No content requested.
    includeGridData: false,
    fields: 'sheets.properties',
    auth: oAuth2Client,
  };
  try {
    const response = (await sheets.spreadsheets.get(request)).data;
    const sheetsProps = [];
    for (let i = 0; i < response.sheets.length; i++) {
      sheetsProps.push({ title: response.sheets[i].properties.title, sheetId: response.sheets[i].properties.sheetId });
    }
    return sheetsProps;
  } catch (err) {
    return Promise.reject(err);
  }
}


/**
 * Changes the title and tab color of a sheet in the Google spreadsheet.
 * @param {number} sheetId The id of the sheet.
 * @param {string} title The new title to set.
 * @returns True or false depending on the operation success.
 */
async function renameGoogleSheet(sheetId, title) { // TODO add tabColor as param and remove hardcoded values.
  const oAuth2Client = await authorize();
  if (oAuth2Client == null || oAuth2Client.error ) {
    return Promise.reject(oAuth2Client.msg);
  }
  const request = {
    spreadsheetId: config.spreadSheetId,
    resource: {
      requests: [{
        updateSheetProperties: {
          properties: {
            sheetId: sheetId,
            title: title,
            tabColor: {
              red: 1,
              green: 0,
              blue: 0,
              alpha: 1.0
            }
          },
          fields: 'title, tabColor'
        }
      }]
    },
    auth: oAuth2Client,
  };
  try {
    const response = await sheets.spreadsheets.batchUpdate(request);
    if (response.status === 200 && response.statusText === 'OK') {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error('An error happened while tryig to rename a sheet: ' + err);
    return false;
  }
}


/**
 * Gets the data from the Google Sheet and returns the content to send.
 * @param {String} version The name of the sheet.
 */
async function listBugsData(version) {
  const oAuth2Client = await authorize();
  if (oAuth2Client == null || oAuth2Client.error ) {
    return Promise.reject(oAuth2Client.msg);
  }
  const request = {
    spreadsheetId: config.spreadSheetId,
    range: version,
    auth: oAuth2Client,
  };
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
 * Global variable to store the emails content to be send by Nodemailer.
 * @type {MailOptions[]} Array of Nodemailer mailOptions objects.
 */
let emailsContent;

// Express initialization.
const app = express();

// View engine.
app.set('view engine', 'pug');

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
    getSpreadsheetSheetsProps().then(sheetsProps => {
      // 'sheetsProps' will be an array of objects like: [{title: "2.5", sheetId: 482742}, {title: "2.6", sheetId: 429284}]
      // Skip the ones that have title end with '_' since those are already sent.
      const filteredProps = sheetsProps.filter(sheet => !sheet.title.endsWith('_'));
      res.render('index', { title: 'User Votes Emailing', versions: filteredProps });
    }, rej => {
      if (rej.code === '400' && rej.message === 'invalid_grant') {
        res.send('Error: You might have to create a new token. Stop the server, delete you current token file, restart the server and follow the steps in the terminal.');
      } else if (rej.code === 'ENOENT' && (rej.errno === -2 || rej.errno === -4058)) {
        res.send('Error: No token.json file, you might have to create a new one, follow the instructions on the server terminal.')
      } else {
        console.log('Unhandled rejected response: ', rej);
        res.status(500).send('<strong>Internal Server Error:</strong> ' + rej.toString());
      }
    });
  });


// Access the parse results as request.body
app.post('/emails/preview', (request, response) => {
    // Save the selected sheet data.
    currentSheetData = request.body;
    console.log('Selected version data: ', currentSheetData); // for example {title: "2.7.1", sheetId: 958824}
    listBugsData(currentSheetData.title).then(bugsData => {
      if (bugsData.length > 0) {
        // Format it to mailOptions objects for nodemailer.
        // TODO the last parameter (infoUrl) would come from the client like request.body.url.
        emailsContent = emailDataManagement.createMailOptions(config.senderEmail, currentSheetData.title, bugsData, config.infoUrl);
        response.json(emailsContent);
      } else {
        response.json(null);
      }
    }, rejected => {
      console.log('Fetching bugs data failed ', rejected);
    });
  });


app.post('/emails/send', (request, response) => {
  if (request.body.order === 'send') {
    nodemailer.sendMails(emailsContent).then(resolved => { // eslint-disable-line no-unused-vars
      // Update some sheet properties to set the sheet as already sent.
      renameGoogleSheet(currentSheetData.sheetId, currentSheetData.title + '_');
      // Send the success to remove the waiting.
      response.json({ status: 'success' }); // TODO send also some data to indicate also that the sheet was udpated? Example: sheetUpdated: ok ? true : false
    }, rejected => {
      // Send the error to remove the waiting.
      response.json({
        status: 'error',
        reason: rejected
       });
    });
  }
});
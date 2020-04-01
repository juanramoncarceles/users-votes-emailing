var express = require('express');
var app = express();

// Required to parse URL-encoded bodies as sent by HTML forms.
//app.use(express.urlencoded());

// Required to parse JSON bodies as sent by API clients.
app.use(express.json());

// Required to serve static files like front end js and css.
app.use(express.static('./'));

app.listen(3000, function() {
    console.log('Listening on port 3000.');
  });

app.get('/', function(req, res) {
  //res.send('Hello World!');
  res.send(pageTemplate);
});

// Access the parse results as request.body
app.post('/', function(request, response){
    // Obtain the dropdown 
    console.log(request.body.version);
    const emailsBodies = createEmails(request.body.version);
    response.json(emailsBodies);
  });




function createEmails(version) {
  const emails = [];
  for (let i = 0; i < 10; i++) {
    emails.push(`This is the email ${i} for version ${version}`);
  }
  return emails;
}


// Temporary data that will be fetched from Google Sheets
const versions = ["2.5", "2.6", "2.7"];

const versionsOptions = versions.map(v => `<option value="${v}">${v}</option>`).join('');

const pageTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>User Votes Emailing</title>
    <style>
      body {
        font-family:sans-serif;
      }
      .main-container {
        width: 80%;
        max-width: 850px;
        margin: auto;
      }
      h1 {
        text-align:center;
      }
      .controls {
        display:flex;
        margin-bottom:1.5rem;
      }
    </style>
</head>
<body>
    <div class="main-container">
      <h1>Emails to be send</h1>
      <div class="controls">
        <form>
            <label for="versionSelect">Choose a version:</label>
            <select name="version" id="versionSelect">
                <option value="">--Please choose an option--</option>
                ${versionsOptions}
            </select>
        </form>
        <button id="sendEmailsBtn">Send emails</button>
      </div>
      <div id="emailsPreview"></div>
    </div>
    <script type="text/javascript" src="./client.js"></script>
</body>
</html>`;
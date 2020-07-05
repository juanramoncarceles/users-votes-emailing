# Users Votes Emailing

## Background

The original purpose of this NodeJS app was to help on the task of sending emails to users that at some point made a request during the developement of a product.
When a request made by a user was fullfilled the corresponding data (email and issue title) was written in a Google Sheet.
Then once the version that includes the fix or feature was released the app fetched the data form the corresponding page of the sheet, processes it to avoid sending more than one email to the same user and eventually sent the emails.

## Installation

* This app requires [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) to be installed.

* Clone the repository move to the root directory with the terminal and run `npm install`.

* Create a `.env` file in the root directory. Inside the file add the credentials for the email that will be used as the sender (it can be your personal email address for example). It should look like this:
  * `MAIL_USER=`*myemailaddress*
  * `MAIL_PASS=`*mypassword*

* At the beginning of the `index.js` file locate a variable called `spreadSheetId` and set the id of the corresponding Google Sheet that you will be working with. The id can be located in the url of the Google Sheet. It looks like this one:
  * `https://docs.google.com/spreadsheets/d/`*1pqQSmY8VqUo9MLiY7A6LqFyB6CA*`/edit#gid=363095`

* To be able to use the Google Sheets API you have to create a `credentials.json` file and place it in the root directory. You can get this file from the [Google Developers Console](https://console.developers.google.com/). Access it, go to the *Library* section and enable the Google Sheets API. Alternatively you can follow the [official Node.js Quickstart](https://developers.google.com/sheets/api/quickstart/nodejs) to enable the API. Once you are done, make sure you download the `credentials.json` file and place it in the root directory of the app.

* First time that you run the app check out the back-end console (not the browser) because you will be requested to access a link to create the `token.json` file. If you delete it at some point you will be requested to access the link to create it again.

* Finally run from the terminal on the root directory `node index.js` or `node .` and access `localhost:3000` in your browser.

### Email template

Currently the email template cannot be edited form the browser UI. 
To change it go to the `emailDataManagement.js` file and at the end you will find the two functions that create the text, one for the HTML version and another one for the plain text version.

## Google Sheet structure

The app needs a specific organization of the data in the Google Sheet to be able to read it successfuly.

* Each page should contain the data for a version (data of an emailing campaign), and the title will be used as the version title in the email.
* The first row of the sheet will be ignored since it is usually used for titles of the columns.
* The first column will be ignored and can be used for example to place the id even if it will no be read by the app.
* The second column should contain the name of the issue.
* From third column onwards each cell can contain one email address. Those are the emails of the users that made the request.

![Example of the organization of a Google Sheet for the app](https://github.com/juanramoncarceles/users-votes-emailing/blob/master/other_resources/docs/UserVotesEmailing_googleSheetSample.png "Google Sheet structure")

## IMPORTANT

If emails fail to be sent, one reason could be that you are using a Gmail account as a sender (the one that you set in the `.env` file). If this is the case access your account and under *Account Settings > Security* enable the option *Allow insecure apps*. You can disable it once you sent the emails.

## License

MIT

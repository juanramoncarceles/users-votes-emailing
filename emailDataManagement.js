module.exports = {

  /**
   * Returns an array of mailOptions objects to send.
   * @param {String} sender The email address of the sender.
   * @param {String} version The VisualARQ version to be released.
   * @param {Array} rawData Array of objects with the raw data received from Google Sheets. Structure:... ?
   * @param {String} url The url to the webpage with info about the new version. Could be a blog post or discourse for example.
   */
  createMailOptions(sender, version, rawData, url) {

    // First restructuration of the data as objects with an array of bugs and an array of addresses:
    const dataToSend = [];
    rawData.forEach((bug, i) => {
      if (i !== 0) {
        dataToSend.push({bugs: [bug[1]], emails: bug.slice(2)});
      }
    });
    // console.log(dataToSend);

    // Restructuration of the data to send to avoid sending more than one email to the same user.
    // Basically users that reported more than one bug are merged so the user only receives one email with all the bugs.
    dataToSend.forEach((mail, i, arr) => {
      if (i === 0) {
        return;
      }
      mail.emails.forEach(address => {
        arr.forEach((obj, j) => {
          if (j >= i) {
            return;
          }
          if (obj.emails.includes(address)) {
            if (obj.emails.length > 1) {
              // Remove the address from the other array          
              obj.emails.splice(obj.emails.indexOf(address), 1);
              // Add bug to the current array of bugs
              obj.bugs.forEach(bug => {mail.bugs.push(bug)});
            } else if (obj.emails.length === 1) {
              // Remove the address from the current array
              mail.emails.length = 0;
              // Add the bug to the other array of bugs
              mail.bugs.forEach(bug => {obj.bugs.push(bug)});
            }
          }
        });
      });
    });
    // console.log(dataToSend);

    // Creation of the mailOptions objects required by nodemailer.
    // Since some objects from dataToSend could have no addresses after restructuration those should be skiped when creating the mailOptions
    /*
    // Example of mailOptions:
    
    // Common fields: from, to, cc, bcc, subject, text, html, attachments.
    const mailOptions = {
      from: sender,
      bcc: 'juanramoncarceles@gmail.com, ramoncarcelesroman@gmail.com',
      subject: 'User votes test',
      text: 'That was easy!'
    };
    
    */

    const mailOptions = [];
    dataToSend.forEach(data => {
      if (data.emails.length !== 0) {
        mailOptions.push({
          from: sender,
          bcc: data.emails.join(', '),
          subject: `VisualARQ ${version} has been released!`,
          text: createPlainTextEmailBody(version, data.bugs, url),
          html: createHTMLEmailBody(version, data.bugs, url)
        });
      }
    });

    return mailOptions;
  }

}


/**
 * Creates the body of the email as HTML.
 * @param {String} version 
 * @param {Array} bugs 
 * @param {String} url 
 */
function createHTMLEmailBody(version, bugs, url) {
  return `<p>Hi!</p><p>Version ${version} of VisualARQ has been released.</p><p>This version includes new features and fixes bugs reported by users.</p><p>These are the bugs you reported:</p><ul>${bugs.map(bug => `<li>${bug}</li>`).join('')}</ul>${url == '' ? '': `<a href="${url}">You can find more information about the new ${version} version here</a>`}<br><p>Thank you and kind regards.</p>`;
}


/**
 * Creates the body of the email as plain text.
 * @param {String} version 
 * @param {Array} bugs 
 * @param {String} url 
 */
function createPlainTextEmailBody(version, bugs, url) {
  return `
  Hi!
  
  Version ${version} of VisualARQ has been released.
  
  This version includes new features and fixes bugs reported by users.
  
  These are the bugs you reported:
  
  ${bugs.map(bug => `- ${bug}`).join('\n ')}
  
  ${url == '' ? '' : `You can find more information about the new version here:
  
  ${url}`
  }


  Thank you and kind regards.
  
  `;
}
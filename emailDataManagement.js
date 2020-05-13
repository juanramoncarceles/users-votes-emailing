/* eslint no-use-before-define: ["error", { functions: false }] */

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
        dataToSend.push({bug: bug[1], emails: bug.slice(2)});
      }
    });
    // console.log(dataToSend);

    // Restructuration of the data to send to avoid sending more than one email to the same user.
    // Basically users that reported more than one bug are merged so the user only receives one email with all the bugs.
    // 1 - Create a new array with one item per bug/user combination.
    const step1Array = [];
    dataToSend.forEach(obj => {
      obj.emails.forEach(email => {
        step1Array.push({ bug: obj.bug, email: email });
      });
    });
    // 2 - Merge the repeated users.
    const step2Array = [];
    step1Array.forEach(obj => {
      const bugsPerEmailObj = step2Array.find(o => o.email === obj.email);
      if (bugsPerEmailObj !== undefined) {
        bugsPerEmailObj.bugs.push(obj.bug);
      } else {
        step2Array.push({ bugs: [obj.bug], email: obj.email });
      }
    });
    // 3 - Merge the equal arrays of bugs.
    const step3Array = [];
    step2Array.forEach(obj => {
      const bugsPerEmailsObj = step3Array.find(o => areArraysEqual(o.bugs, obj.bugs));
      if (bugsPerEmailsObj !== undefined) {
        bugsPerEmailsObj.emails.push(obj.email);
      } else {
        step3Array.push({ bugs: [...obj.bugs], emails: [obj.email] });
      }
    });


    /*
    Example of mailOptions object:
    Common fields are: from, to, cc, bcc, subject, text, html, attachments.
    const mailOptions = {
      from: sender,
      bcc: 'juanramoncarceles@gmail.com, ramoncarcelesroman@gmail.com',
      subject: 'User votes test',
      text: 'That was easy!'
    };    
    */

    // Creation of the mailOptions objects required by nodemailer.
    const mailOptions = [];
    step3Array.forEach(data => {
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


/**
 * Checks if to arrays contain the same values.
 * @param {Array} arr1 
 * @param {Array} arr2 
 * @returns {boolean}
 */
function areArraysEqual(arr1, arr2) { 
  if (arr1.length === arr2.length) {
    for (let i = 0; i < arr1.length; i++) {
      if(!arr2.includes(arr1[i])) return false;
    }
    return true;
  } else {
    return false;
  } 
}
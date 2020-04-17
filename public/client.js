const selectVersion = document.getElementById('versionSelect');
const emailsPreviewContainer = document.getElementById('emailsPreview');
const sendEmailsBtn = document.getElementById('sendEmailsBtn');
const emailingDetails = document.getElementById('emailingDetails');


/**
 * Fetches the an array of the emails contents and and adds the contents
 * to the DOM for preview purposes.
 * @param {string} version For example: "2.5", "2.6"...
 */
function getEmailsPreview(version) {
  fetch('http://localhost:3000/emails/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: version }),
  })
    .then(res => {
      return res.json();
    })
    .then(emailsContent => {
      emailingDetails.innerHTML = `<h3>${emailsContent[0].subject}</h3><p>${emailsContent[0].from.replace('<','&lt;').replace('>','&gt;')}</p>`;
      const previewEmailsContent = emailsContent.map(content => {
        return `<div class="email-content">
            <p class="recipient"><strong>Recipient (bcc): </strong><span>${content.bcc.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span></p>
            <div class="email-body">${content.html}</div>
          </div>`
      });      
      emailsPreviewContainer.innerHTML = previewEmailsContent.join('');
    })
    .catch(err => {
      console.error('Error:', err);
    });
}


selectVersion.addEventListener('change', e => {
  //console.log(e.target.selectedIndex);
  // TODO: value should be different than current
  getEmailsPreview(e.target.value);
});


/**
 * Executes the request to send the emails from the backend.
 * TODO: Disable the option to call this function if any preview has been requested.
 */
function sendEmails() {
  fetch('http://localhost:3000/emails/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ order: 'send' }),
  }).then(res => {
    console.log(res);
  });
}


sendEmailsBtn.addEventListener('click', () => {
  // Show dialog with a question: 'Emails are going to be send. Do you want to proceed?
  sendEmails(); // TODO: Call this instead from the confirm button of a dialog.
});
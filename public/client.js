const selectVersion = document.getElementById('versionSelect');
const emailsPreviewContainer = document.getElementById('emailsPreview');
const sendEmailsBtn = document.getElementById('sendEmailsBtn');
const emailingDetails = document.getElementById('emailingDetails');

selectVersion.addEventListener('change', e => {
  //console.log(e.target.selectedIndex);
  // TODO value shuld be different than 
  getEmailsPreview(e.target.value);
});

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
            <p class="recipient"><strong>Recipient (bcc): </strong><span>${content.bcc}</span></p>
            <div class="email-body">${content.html}</div>
          </div>`
      });      
      emailsPreviewContainer.innerHTML = previewEmailsContent.join('');
    })
    .catch(err => {
      console.error('Error:', err);
    });
}

sendEmailsBtn.addEventListener('click', () => {
  //console.log('Emails are going to be send. Are you sure?');
  sendEmails(); // TODO: Call this instead from the confirm button.
});

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
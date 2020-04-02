const selectVersion = document.getElementById('versionSelect');
const emailsPreviewContainer = document.getElementById('emailsPreview');
const sendEmailsBtn = document.getElementById('sendEmailsBtn');

selectVersion.addEventListener('change', e => {
  //console.log(e.target.selectedIndex);
  // TODO value shuld be different than 
  getEmailsPreview(e.target.value);
});

function getEmailsPreview(version) {
  fetch('http://localhost:3000', {
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
      console.log(emailsContent);
      const previewEmailsContent = emailsContent.map(content => {
        return `<div class="email-content">
            <p><strong>from: </strong><span>${content.from}</span></p>
            <p><strong>bcc: </strong><span>${content.bcc}</span></p>
            <p><strong>subject: </strong><span>${content.subject}</span></p>
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
  console.log('Emails are going to be send. Are you sure?');
});
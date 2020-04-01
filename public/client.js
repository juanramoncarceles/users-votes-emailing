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
    .then(data => {
      emailsPreviewContainer.innerText = data.join('');
      //console.log('Success:', data);
    })
    .catch(err => {
      console.error('Error:', err);
    });
}

sendEmailsBtn.addEventListener('click', () => {
  console.log('Emails are going to be send. Are you sure?');
});
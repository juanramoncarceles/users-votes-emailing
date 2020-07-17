const selectVersion = document.getElementById('versionSelect');
const emailsPreviewContainer = document.getElementById('emailsPreview');
const sendEmailsBtn = document.getElementById('sendEmailsBtn');
const emailingDetails = document.getElementById('emailingDetails');


/**
 * SVG animated icon.
 */
const svgLoader = `
  <svg width="38" height="38" viewBox="0 0 38 38">
    <g transform="translate(1 1)" stroke-width="2" fill="none" stroke="#0088a7">
      <circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
      <path d="M36 18c0-9.94-8.06-18-18-18" transform="rotate(153.876 18 18)">
        <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/>
      </path>
    </g>
  </svg>`;


/**
 * Executes the request to send the emails from the backend.
 */
async function sendEmails() {
  try {
    const sendEmailsRes = await fetch('http://localhost:3000/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order: 'send' }),
    });
    if (sendEmailsRes.ok === true && sendEmailsRes.status === 200) {
      return sendEmailsRes.json();
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


/**
 * Shows a dialog with a message and an optional action.
 * TODO missing the text inside buttons as parameters.
 * @param {string} message 
 * @param {CallableFunction} action 
 */
function showDialog(message, action = undefined) {
  const dialogBgWrapper = document.createElement('div');
  dialogBgWrapper.classList.add('dialog-bg');
  const dialogContainer = document.createElement('div');
  dialogContainer.classList.add('dialog-container');
  dialogBgWrapper.appendChild(dialogContainer);
  const loaderIconContainer = document.createElement('div');
  loaderIconContainer.classList.add('dialog-loader');
  loaderIconContainer.innerHTML = svgLoader;
  const buttonsContainer = document.createElement('div');
  buttonsContainer.classList.add('dialog-buttons');
  if (action) {
    // Add action button
    const mainButton = document.createElement('button');
    mainButton.onclick = () => {
      // Button is disabled.
      mainButton.onclick = null;
      mainButton.disabled = true;
      if (action.constructor.name === 'AsyncFunction') {
        // If action is async show a loader icon until action is resolved.
        dialogContainer.classList.add('waiting');
        action().then(res => {
          if (res.status === 'success') {
            dialogBgWrapper.remove();
            showDialog('Emails sent successfully!');
          } else if (res.status === 'error') {
            console.log(res.reason);
            dialogBgWrapper.remove();
            showDialog('ERROR: ' + JSON.stringify(res.reason));
          }
        }).catch(error => console.error('Error:', error));
      } else {
        // If action is not async just close the dialog after the action.
        action();
        dialogBgWrapper.remove();
      }
    };
    mainButton.innerText = 'Send';
    buttonsContainer.appendChild(mainButton);
  }
  // Create cancel button
  const secondaryButton = document.createElement('button');
  secondaryButton.onclick = () => dialogBgWrapper.remove();
  secondaryButton.innerText = 'Cancel';
  buttonsContainer.appendChild(secondaryButton);
  dialogContainer.appendChild(loaderIconContainer);
  dialogContainer.appendChild(buttonsContainer);
  dialogContainer.insertAdjacentHTML('afterbegin', `<span>${message}</span>`);
  document.body.appendChild(dialogBgWrapper);
}


/**
 * Fetches the an array of the emails contents and and adds the contents
 * to the DOM to preview them.
 * @param {Object} versionData Corresponds to an object like {title: '': sheetId: 482738}
 */
function getEmailsPreview(versionData) {
  fetch('http://localhost:3000/emails/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(versionData),
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
      sendEmailsBtn.onclick = () => showDialog('Emails are going to be send. Do you want to proceed?', sendEmails);
      sendEmailsBtn.classList.remove('disabled');
    })
    .catch(err => {
      console.error('Error:', err);
    });
}


// Version dropdown options handler.
selectVersion.addEventListener('change', e => {
  emailsPreviewContainer.innerHTML = '';
  emailingDetails.innerHTML = '';
  if (e.target.value !== '') {
    const loaderIconContainer = document.createElement('div');
    loaderIconContainer.classList.add('emails-loader');
    loaderIconContainer.innerHTML = svgLoader;
    emailsPreviewContainer.appendChild(loaderIconContainer);
    getEmailsPreview({ title: selectVersion.options[selectVersion.selectedIndex].textContent, sheetId: e.target.value });
  } else {
    sendEmailsBtn.onclick = null;
    sendEmailsBtn.classList.add('disabled');
  }
});

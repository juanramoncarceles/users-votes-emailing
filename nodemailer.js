require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

module.exports = {

  /**
   * Sends emails using Nodemailer.
   * @param {Object[]} mailOptionsArr Array of mail options required by Nodemailer.
   */
  async sendMails(mailOptionsArr) {
    const emailsPromises = [];
    mailOptionsArr.forEach(mailOptions => {
      emailsPromises.push(transporter.sendMail(mailOptions));
    });
    await Promise.all(emailsPromises);
  }

}
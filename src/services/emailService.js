const brevo = require('@getbrevo/brevo');

const sendEmail = async (options) => {
  // Initialize the Brevo API client
  const apiInstance = new brevo.TransactionalEmailsApi();
  
  // Set your API key for authentication
  const apiKey = apiInstance.authentications['apiKey'];
  apiKey.apiKey = process.env.BREVO_API_KEY;

  // Validate API key exists
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not set in environment variables');
  }

  // Construct the email payload
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = options.subject;
  sendSmtpEmail.htmlContent = options.html;
  sendSmtpEmail.sender = {
    name: process.env.EMAIL_FROM_NAME || 'Auth System',
    email: process.env.EMAIL_FROM
  };
  sendSmtpEmail.to = [{ email: options.email }];
  
  // Optional: Add reply-to
  if (process.env.EMAIL_REPLY_TO) {
    sendSmtpEmail.replyTo = {
      email: process.env.EMAIL_REPLY_TO,
      name: process.env.EMAIL_FROM_NAME || 'Auth System'
    };
  }

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Email sent successfully to ${options.email}`);
    console.log(`📧 Message ID: ${response.messageId}`);
    return response;
  } catch (error) {
    console.error('❌ Brevo API Error Details:', error.response?.body || error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = sendEmail;
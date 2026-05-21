import axios from 'axios';

export default async function sendEmail({ to, subject, html, fromName }: any) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromNameValue = fromName || process.env.EMAIL_FROM_NAME || 'Auth System';

  if (!apiKey || !fromEmail) {
    console.error('⚠️ Email not configured - missing API key or FROM email');
    return { success: false, message: 'Email not configured' };
  }

  const emailData = {
    sender: {
      name: fromNameValue,
      email: fromEmail
    },
    to: [
      {
        email: to,
        name: to.split('@')[0]
      }
    ],
    subject: subject,
    htmlContent: html
  };

  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      emailData,
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log(`✅ Email sent to ${to}`);
    console.log(`📧 Message ID: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
    
  } catch (error: any) {
    console.error('❌ Brevo API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from Brevo');
    } else {
      console.error('Error:', error.message);
    }
    return { success: false };
  }
}
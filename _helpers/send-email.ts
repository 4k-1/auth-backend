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
    sender: { name: fromNameValue, email: fromEmail },
    to: [{ email: to, name: to.split('@')[0] }],
    subject,
    htmlContent: html
  };

  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' }
    });
    console.log(`✅ Email sent to ${to}`);
    return { success: true, messageId: response.data.messageId };
  } catch (error: any) {
    console.error('❌ Email failed:', error.response?.data || error.message);
    return { success: false };
  }
}
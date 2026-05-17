// src/utils/email.js
const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
let apiInstance = null;

function getBrevoClient() {
  if (!apiInstance) {
    apiInstance = new brevo.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    if (!process.env.BREVO_API_KEY) {
      console.error('❌ BREVO_API_KEY is not set in environment variables');
    }
  }
  return apiInstance;
}

async function sendVerificationEmail(email, firstName, verificationToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
  
  const client = getBrevoClient();
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = 'Verify Your Email Address';
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .button:hover { background-color: #4338CA; }
        .footer { font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center; }
        .code { background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our App!</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Thank you for registering! Please verify your email address to complete your account setup.</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p class="code">${verificationUrl}</p>
          <p><strong>This link will expire in 24 hours.</strong></p>
          <div class="footer">
            <p>If you didn't create an account, please ignore this email.</p>
            <hr>
            <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = {
    name: process.env.EMAIL_FROM_NAME || 'Auth System',
    email: process.env.EMAIL_FROM
  };
  sendSmtpEmail.to = [{ email: email }];

  try {
    const response = await client.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Verification email sent to ${email}, Message ID: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ Brevo send error:', error.response?.body || error.message);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}

async function sendPasswordResetEmail(email, firstName, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  const client = getBrevoClient();
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = 'Reset Your Password';
  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reset Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { font-size: 12px; color: #6B7280; margin-top: 30px; }
        .warning { background: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link:</p>
          <p style="background:#e5e7eb; padding:10px; word-break:break-all;">${resetUrl}</p>
          <div class="warning">
            <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your App Name. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  sendSmtpEmail.sender = {
    name: process.env.EMAIL_FROM_NAME || 'Auth System',
    email: process.env.EMAIL_FROM
  };
  sendSmtpEmail.to = [{ email: email }];

  try {
    const response = await client.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ Password reset email sent to ${email}, Message ID: ${response.messageId}`);
    return { success: true, messageId: response.messageId };
  } catch (error) {
    console.error('❌ Brevo send error:', error.response?.body || error.message);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
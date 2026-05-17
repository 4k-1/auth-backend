// src/utils/email.js - Using Axios (No SDK issues!)
const axios = require('axios');

async function sendVerificationEmail(email, firstName, verificationToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
  
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || 'Auth System';
  
  // Validate configuration
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not set in environment variables');
  }
  if (!fromEmail) {
    throw new Error('EMAIL_FROM is not set in environment variables');
  }

  // Prepare the email payload
  const emailData = {
    sender: {
      name: fromName,
      email: fromEmail
    },
    to: [
      {
        email: email,
        name: firstName
      }
    ],
    subject: 'Verify Your Email Address',
    htmlContent: `
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
          .footer { font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center; }
          .code { background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; font-size: 12px; }
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
    `
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
    
    console.log(`✅ Verification email sent to ${email}`);
    console.log(`📧 Message ID: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
    
  } catch (error) {
    console.error('❌ Brevo API Error Details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`Brevo API error: ${error.response.data.message || error.response.status}`);
    } else if (error.request) {
      console.error('No response received from Brevo');
      throw new Error('No response from Brevo API');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
}

async function sendPasswordResetEmail(email, firstName, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
  
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;
  const fromName = process.env.EMAIL_FROM_NAME || 'Auth System';

  const emailData = {
    sender: {
      name: fromName,
      email: fromEmail
    },
    to: [
      {
        email: email,
        name: firstName
      }
    ],
    subject: 'Reset Your Password',
    htmlContent: `
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
          .footer { font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center; }
          .warning { background: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .code { background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; font-size: 12px; }
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
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${resetUrl}</p>
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
    `
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
    
    console.log(`✅ Password reset email sent to ${email}`);
    console.log(`📧 Message ID: ${response.data.messageId}`);
    return { success: true, messageId: response.data.messageId };
    
  } catch (error) {
    console.error('❌ Brevo API Error Details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      throw new Error(`Brevo API error: ${error.response.data.message || error.response.status}`);
    } else if (error.request) {
      console.error('No response received from Brevo');
      throw new Error('No response from Brevo API');
    } else {
      console.error('Error:', error.message);
      throw error;
    }
  }
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
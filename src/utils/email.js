const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Auto-create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Ethereal test account created:');
    console.log('   User:', testAccount.user);
    console.log('   Pass:', testAccount.pass);
    console.log('   Preview URL: https://ethereal.email');

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

async function sendVerificationEmail(email, firstName, token) {
  const transport = await getTransporter();
  const verifyUrl = `${process.env.FRONTEND_URL}/account/verify-email?token=${token}`;

  const info = await transport.sendMail({
    from: `"Auth System" <${process.env.EMAIL_FROM || 'noreply@authsystem.com'}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Welcome, ${firstName}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" 
           style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; 
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #666;">Or copy this link: <a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('📧 Email preview URL:', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
}

async function sendPasswordResetEmail(email, firstName, token) {
  const transport = await getTransporter();
  const resetUrl = `${process.env.FRONTEND_URL}/account/reset-password?token=${token}`;

  const info = await transport.sendMail({
    from: `"Auth System" <${process.env.EMAIL_FROM || 'noreply@authsystem.com'}>`,
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a2e;">Password Reset Request</h2>
        <p>Hi ${firstName}, we received a request to reset your password.</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #dc2626;
                  color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #666;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #666; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log('📧 Reset email preview URL:', previewUrl);
  }

  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };

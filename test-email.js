// test-email.js
require('dotenv').config();
const { sendVerificationEmail } = require('./src/utils/email');

async function test() {
  console.log('=== Testing Brevo Email ===\n');
  console.log('Configuration:');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('  BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✓ Set (length: ' + process.env.BREVO_API_KEY.length + ')' : '✗ Missing');
  console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:4200');
  console.log('');
  
  if (!process.env.BREVO_API_KEY) {
    console.error('❌ BREVO_API_KEY is missing from .env file!');
    console.log('\nPlease add to your .env file:');
    console.log('BREVO_API_KEY=your_api_key_here');
    return;
  }
  
  if (!process.env.EMAIL_FROM) {
    console.error('❌ EMAIL_FROM is missing from .env file!');
    return;
  }
  
  try {
    console.log('Sending test email...');
    const result = await sendVerificationEmail(
      'alyssamariedelgado3@gmail.com',
      'Test User',
      'test-token-123'
    );
    console.log('\n✅ Email sent successfully!');
    console.log('📧 Check your inbox at:', process.env.EMAIL_FROM);
  } catch (error) {
    console.error('\n❌ Failed to send email:');
    console.error(error.message);
  }
}

test();
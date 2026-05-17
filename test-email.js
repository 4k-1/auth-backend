require('dotenv').config();
const { sendVerificationEmail } = require('./src/utils/email');

async function test() {
  console.log('Testing Brevo email...');
  console.log('From:', process.env.EMAIL_FROM);
  console.log('API Key exists:', !!process.env.BREVO_API_KEY);
  
  try {
    const result = await sendVerificationEmail(
      'alyssamariedelgado3@gmail.com',  // Send to yourself
      'Test User',
      'test-token-123'
    );
    console.log('✅ Email sent successfully!', result);
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

test();
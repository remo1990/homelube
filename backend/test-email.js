require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { sendTestEmail, verifyEmailConfig, sendBrandedEmail } = require('./services/email');

async function testEmailSetup() {
  console.log('\n=== Testing Email Configuration ===');
  console.log('Current working directory:', process.cwd());
  console.log('Environment file path:', require('path').join(__dirname, '.env'));
  
  // Check environment variables
  console.log('\nEnvironment Variables:');
  console.log('MAILTRAP_HOST:', process.env.MAILTRAP_HOST || 'Not set');
  console.log('MAILTRAP_PORT:', process.env.MAILTRAP_PORT || 'Not set');
  console.log('MAILTRAP_USER:', process.env.MAILTRAP_USER || 'Not set');
  console.log('MAILTRAP_PASS:', process.env.MAILTRAP_PASS ? 'Set' : 'Not set');
  
  // First verify the configuration
  console.log('\nVerifying email configuration...');
  const configResult = await verifyEmailConfig();
  console.log('Configuration verification result:', configResult);

  if (configResult.success) {
    console.log('\nSending test branded email...');
    try {
      const result = await sendBrandedEmail({
        to: 'test@example.com',
        subject: 'Your 2008 HONDA ACCORD is almost due for an oil change.',
        templateData: {
          companyName: 'HomeLube',
          logoUrl: 'https://dummyimage.com/200x60/900/fff&text=HomeLube+Logo',
          recipientName: 'Ramu',
          vehicleYear: '2008',
          vehicleModel: 'HONDA ACCORD',
          couponCode: 'HL25OFF',
          couponExpiry: '06/19/2025',
        }
      });
      console.log('\nTest branded email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('Preview URL:', result.previewUrl);
    } catch (error) {
      console.error('\nFailed to send test branded email:', error.message);
    }
  } else {
    console.error('\nEmail configuration is invalid. Please check your .env file.');
  }
}

// Run the test
testEmailSetup().catch(console.error); 
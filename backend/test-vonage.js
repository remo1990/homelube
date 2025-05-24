require('dotenv').config();
const { Vonage } = require('@vonage/server-sdk');

console.log('\n=== Testing Vonage Configuration ===');
console.log('VONAGE_API_KEY:', process.env.VONAGE_API_KEY);
console.log('VONAGE_API_SECRET:', process.env.VONAGE_API_SECRET);
console.log('VONAGE_PHONE_NUMBER:', process.env.VONAGE_PHONE_NUMBER);

try {
  const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
  });
  console.log('\nVonage client initialized successfully');
} catch (error) {
  console.error('\nError initializing Vonage:', error);
} 
const { Vonage } = require('@vonage/server-sdk');

// Initialize Vonage client
let vonage;
try {
  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    console.warn('Vonage credentials not configured. SMS notifications will be disabled.');
  } else {
    vonage = new Vonage({
      apiKey: process.env.VONAGE_API_KEY,
      apiSecret: process.env.VONAGE_API_SECRET,
      applicationId: process.env.VONAGE_APPLICATION_ID,
      privateKey: process.env.VONAGE_PRIVATE_KEY
    });
    console.log('Vonage client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Vonage client:', error);
}

// Function to send SMS
const sendSMS = async (to, message) => {
  if (!vonage) {
    console.warn('Vonage client not configured, skipping SMS notification');
    return;
  }

  try {
    // Format phone number to E.164 format
    const formattedTo = formatPhoneNumber(to);
    
    // Send message using Messages API
    const response = await vonage.messages.send({
      channel: 'sms',
      message_type: 'text',
      to: formattedTo,
      from: process.env.VONAGE_PHONE_NUMBER,
      text: message
    });

    console.log('SMS sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

// Format phone number to E.164 format
const formatPhoneNumber = (phone) => {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Add +1 if it's a US number without country code
  return cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
};

// Validate phone number format
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

module.exports = {
  vonage,
  sendSMS,
  validatePhoneNumber
}; 
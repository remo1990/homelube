const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  console.log('\n=== Mailtrap Configuration Check ===');
  console.log('Environment file path:', path.join(__dirname, '..', '.env'));
  console.log('Host:', process.env.MAILTRAP_HOST || 'Not set');
  console.log('Port:', process.env.MAILTRAP_PORT || 'Not set');
  console.log('User:', process.env.MAILTRAP_USER || 'Not set');
  console.log('Password:', process.env.MAILTRAP_PASS ? 'Set' : 'Not set');

  if (!process.env.MAILTRAP_HOST || !process.env.MAILTRAP_PORT || 
      !process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
    throw new Error('Mailtrap credentials not configured. Please check your .env file.');
  }

  return nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS
    }
  });
};

// Initialize transporter
const transporter = createTransporter();

// Function to send email
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: 'HomeLube Assist <noreply@homelubeassist.com>',
      to,
      subject,
      html,
      attachments
    };

    console.log('\n=== Email Request Details ===');
    console.log('From:', mailOptions.from);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Attachments:', attachments.length);

    const info = await transporter.sendMail(mailOptions);
    
    console.log('\n=== Email Response Details ===');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Status: Success');
    console.log('================================\n');

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info)
    };
  } catch (error) {
    console.error('\n=== Email Error Details ===');
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    console.error('Status: Failed');
    console.error('================================\n');
    throw error;
  }
};

// Function to verify email configuration
const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    return {
      success: true,
      message: 'Email configuration is valid'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Email configuration error: ' + error.message
    };
  }
};

// Test email function
const sendTestEmail = async () => {
  try {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email from HomeLube',
      html: '<h1>Test Email</h1><p>This is a test email from HomeLube.</p>'
    });
    console.log('Test email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send test email:', error);
    throw error;
  }
};

// Function to generate branded HTML email body
function generateBrandedEmail({
  companyName = 'HomeLube',
  logoUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/private/org-3bQwQwQwQwQwQwQwQwQwQw/user-abc123/img-xyz4567890abcdef1234567890abcdef.png',
  bannerText = 'YOUR VEHICLE IS ALMOST DUE FOR AN OIL CHANGE!',
  bannerColor = '#a50034',
  imageUrl = 'https://dummyimage.com/600x200/a50034/fff&text=Oil+Change',
  recipientName = 'Customer',
  vehicleYear = '2008',
  vehicleModel = 'HONDA ACCORD',
  mainMessage = '',
  couponCode = 'HL25OFF',
  couponExpiry = '06/19/2025',
  couponText = '$25 OFF',
  couponDetails = 'HOMELUBE SIGNATURE SERVICE® OIL CHANGE WITH PREMIUM OIL',
  couponRestrictions = 'Must present coupon at time of service. Not valid with any other offer or the same service. Only valid at participating HomeLube locations.',
  calloutBox = "You're one click away from scheduling your oil change! Or text us at 669-336-1300 to get started.",
  callToAction = "Relax at home — we'll come to you! With HomeLube's trusted mobile oil change service, our certified technicians handle everything right in your driveway. It's fast, convenient, and backed by our commitment to quality you can count on.",
  supportUrl = '#',
  promoColor = '#a50034',
  couponBg = '#fff',
  couponTextColor = '#a50034',
  calloutBg = '#000',
  calloutTextColor = '#fff',
}) {
  return `
  <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 0; margin: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
      <tr>
        <td style="padding: 24px 24px 0 24px; text-align:center; background:#fff;">
          <img src="${logoUrl}" alt="${companyName} Logo" style="max-width:200px; height:auto; margin-bottom:12px;" />
        </td>
      </tr>
      <tr>
        <td style="text-align:center;">
          <div style="display:inline-block; max-width:400px; width:100%; background:${bannerColor}; color:#fff; font-size:20px; font-weight:bold; padding:18px 12px; letter-spacing:1px; border-radius:12px; margin:24px auto 12px auto; box-shadow:0 2px 8px rgba(0,0,0,0.10);">
            ${bannerText}
          </div>
        </td>
      </tr>
      <tr>
        <td style="text-align:center; background:#fff;">
          <img src="${imageUrl}" alt="Oil Change" style="width:100%; max-width:400px; height:auto; display:block; margin:0 auto 24px auto; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.07);" />
        </td>
      </tr>
      <tr>
        <td style="padding: 24px; background:#fff;">
          <p style="font-size:16px; color:#222; margin:0 0 16px 0;">Dear ${recipientName},</p>
          <p style="font-size:16px; color:#222; margin:0 0 16px 0;">It looks like it's almost time to give your <b>${vehicleYear} ${vehicleModel}</b> some TLC.</p>
          <p style="font-size:16px; color:#222; margin:0 0 16px 0;">${callToAction}</p>
          <p style="font-size:16px; color:#222; margin:0 0 16px 0;"><b>Hope to see you soon!</b><br>Your friends at <span style="color:${promoColor}; font-weight:bold;">${companyName}</span></p>
        </td>
      </tr>
      <tr>
        <td style="background:${calloutBg}; color:${calloutTextColor}; text-align:center; font-size:16px; font-weight:bold; padding:16px 8px; letter-spacing:1px;">
          ${calloutBox}
        </td>
      </tr>
      <tr>
        <td style="padding: 0 24px 24px 24px; background:#fff;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;">
            <tr>
              <td style="background:${couponBg}; border:2px dashed ${promoColor}; border-radius:8px; text-align:center; padding:24px 16px;">
                <div style="font-size:32px; color:${couponTextColor}; font-weight:bold; margin-bottom:8px;">${couponText}</div>
                <div style="font-size:16px; color:#222; font-weight:bold; margin-bottom:8px;">${couponDetails}</div>
                <div style="font-size:18px; color:${promoColor}; font-weight:bold; margin-bottom:8px;">CODE: ${couponCode}</div>
                <div style="font-size:13px; color:#555; margin-bottom:8px;">EXPIRE: ${couponExpiry}. Only valid at participating ${companyName} locations</div>
                <div style="font-size:12px; color:#888;">${couponRestrictions}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px 24px 24px; background:#fff; text-align:center; font-size:13px; color:#888;">
          Need help? <a href="${supportUrl}" style="color:${promoColor}; text-decoration:underline;">Contact support</a>
        </td>
      </tr>
    </table>
  </div>
  `;
}

// Updated sendEmail to accept dynamic data and use the template
const sendBrandedEmail = async ({
  to,
  subject,
  templateData,
  attachments = []
}) => {
  const html = generateBrandedEmail(templateData);
  return sendEmail({ to, subject, html, attachments });
};

module.exports = {
  sendEmail,
  verifyEmailConfig,
  sendTestEmail,
  generateBrandedEmail,
  sendBrandedEmail
}; 
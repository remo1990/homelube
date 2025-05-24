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

// Function to generate appointment confirmation email
function generateAppointmentConfirmationEmail({
  companyName = 'HomeLube',
  logoUrl = 'https://dummyimage.com/200x60/900/fff&text=HomeLube+Logo',
  vehicleInfo = {},
  appointmentDate = new Date(),
  serviceAddress = {},
  trackingId = '',
  trackingUrl = '',
}) {
  return `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 0; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
        <!-- Header with Logo -->
        <tr>
          <td style="padding: 32px 24px 0 24px; text-align:center; background:#fff;">
            <img src="${logoUrl}" alt="${companyName} Logo" style="max-width:200px; height:auto; margin-bottom:16px;" />
            <div style="font-size:14px; color:#666; margin-top:8px;">Professional Mobile Oil Change Service</div>
          </td>
        </tr>

        <!-- Trust Badges -->
        <tr>
          <td style="padding: 0 24px; background:#fff; text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
              <tr>
                <td style="width:33.33%; text-align:center; padding:8px;">
                  <div style="font-size:24px; color:#28a745;">✓</div>
                  <div style="font-size:12px; color:#666; margin-top:4px;">Certified Technicians</div>
                </td>
                <td style="width:33.33%; text-align:center; padding:8px;">
                  <div style="font-size:24px; color:#28a745;">✓</div>
                  <div style="font-size:12px; color:#666; margin-top:4px;">100% Satisfaction</div>
                </td>
                <td style="width:33.33%; text-align:center; padding:8px;">
                  <div style="font-size:24px; color:#28a745;">✓</div>
                  <div style="font-size:12px; color:#666; margin-top:4px;">Quality Guaranteed</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Confirmation Banner -->
        <tr>
          <td style="text-align:center;">
            <div style="display:inline-block; max-width:400px; width:100%; background:linear-gradient(135deg, #28a745, #1e7e34); color:#fff; font-size:22px; font-weight:bold; padding:20px 16px; letter-spacing:0.5px; border-radius:12px; margin:24px auto 12px auto; box-shadow:0 4px 12px rgba(40,167,69,0.2);">
              ✅ Your Appointment is Confirmed!
            </div>
          </td>
        </tr>

        <!-- Main Content -->
        <tr>
          <td style="padding: 24px; background:#fff;">
            <p style="font-size:18px; color:#222; margin:0 0 16px 0; line-height:1.5;">Thank you for choosing <span style="color:#28a745; font-weight:bold;">${companyName}</span>! We're excited to provide you with our premium mobile oil change service.</p>
            
            <!-- Appointment Details Box -->
            <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:12px; padding:32px; margin:24px 0; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
              <h3 style="color:#222; margin:0 0 24px 0; font-size:20px; border-bottom:2px solid #28a745; padding-bottom:12px;">Appointment Details</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e9ecef;">
                    <strong style="color:#28a745; font-size:16px;">Vehicle Information</strong><br>
                    <span style="font-size:16px; color:#222;">${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0; border-bottom:1px solid #e9ecef;">
                    <strong style="color:#28a745; font-size:16px;">Date & Time</strong><br>
                    <span style="font-size:16px; color:#222;">${appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <strong style="color:#28a745; font-size:16px;">Service Address</strong><br>
                    <span style="font-size:16px; color:#222;">
                      ${serviceAddress.street}<br>
                      ${serviceAddress.city}, ${serviceAddress.state} ${serviceAddress.zipCode}
                    </span>
                  </td>
                </tr>
              </table>

              <div style="background:#fff; border:1px solid #e9ecef; border-radius:8px; padding:16px; margin:16px 0;">
                <p style="font-size:14px; color:#666; margin:0 0 8px 0;">Tracking ID</p>
                <p style="font-size:16px; color:#28a745; font-weight:bold; margin:0;">${trackingId}</p>
              </div>
              
              <a href="${trackingUrl}" style="display:inline-block; background:linear-gradient(135deg, #28a745, #1e7e34); color:#fff; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:bold; margin-top:8px; text-align:center; width:100%; box-shadow:0 4px 12px rgba(40,167,69,0.2);">Track Your Appointment</a>
            </div>
            
            <!-- Service Promise -->
            <div style="background:#fff; border:2px solid #28a745; border-radius:12px; padding:24px; margin:24px 0; text-align:center;">
              <h4 style="color:#28a745; margin:0 0 16px 0; font-size:18px;">Our Service Promise</h4>
              <p style="font-size:16px; color:#222; margin:0; line-height:1.5;">
                Our certified technicians will arrive at your location with all necessary equipment and premium oil. 
                We'll complete your service efficiently while maintaining the highest standards of quality and safety.
              </p>
            </div>

            <p style="font-size:16px; color:#222; margin:24px 0 0 0; line-height:1.5;">We look forward to providing you with exceptional service!</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 24px; background:#f8f9fa; text-align:center; border-top:1px solid #e9ecef;">
            <p style="font-size:14px; color:#666; margin:0 0 16px 0;">Need assistance? We're here to help!</p>
            <a href="${trackingUrl}" style="display:inline-block; color:#28a745; text-decoration:none; font-weight:bold; padding:8px 16px; border:2px solid #28a745; border-radius:6px;">Contact Support</a>
            <p style="font-size:12px; color:#888; margin:16px 0 0 0;">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;
}

module.exports = {
  sendEmail,
  verifyEmailConfig,
  sendTestEmail,
  generateBrandedEmail,
  sendBrandedEmail,
  generateAppointmentConfirmationEmail
}; 
const express = require('express');
const router = express.Router();
const OilChange = require('../models/OilChange');
const ical = require('ical-generator').default;
const crypto = require('crypto');
const { sendSMS } = require('../config/vonage');
const { sendEmail, verifyEmailConfig } = require('../services/email');

// Generate a unique tracking ID
const generateTrackingId = () => {
  return crypto.randomBytes(16).toString('hex');
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

// Endpoint to verify email configuration
router.get('/verify-email-config', async (req, res) => {
  try {
    const result = await verifyEmailConfig();
    res.json(result);
  } catch (error) {
    console.error('Error verifying email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email configuration',
      error: error.message
    });
  }
});

// Create a new oil change appointment
router.post('/', async (req, res) => {
  try {
    const {
      vehicleInfo,
      serviceAddress,
      preferredDate,
      preferredTime,
      urgency,
      customerEmail,
      customerPhone,
      serviceProviderEmail
    } = req.body;

    // Validate phone number
    if (!customerPhone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for appointment notifications'
      });
    }

    if (!validatePhoneNumber(customerPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please provide a valid phone number.'
      });
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(customerPhone);

    const trackingId = generateTrackingId();
    const appointmentDate = new Date(`${preferredDate}T${preferredTime}`);

    // Create calendar event
    const calendar = ical({
      name: 'HomeLube Appointment',
      timezone: 'UTC'
    });

    calendar.createEvent({
      start: appointmentDate,
      end: new Date(appointmentDate.getTime() + 60 * 60 * 1000), // 1 hour duration
      summary: 'Oil Change Service',
      description: `Vehicle: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}\nService Address: ${serviceAddress}\nUrgency: ${urgency}`,
      location: `${serviceAddress.street}, ${serviceAddress.city}, ${serviceAddress.state} ${serviceAddress.zipCode}`,
      url: `${process.env.FRONTEND_URL}/appointment/${trackingId}`,
      organizer: { name: 'HomeLube', email: serviceProviderEmail },
      attendees: [
        { email: customerEmail, rsvp: true },
        { email: serviceProviderEmail, rsvp: true }
      ]
    });

    // Save appointment to database first
    const appointment = new OilChange({
      trackingId,
      vehicleInfo,
      serviceAddress,
      appointmentDate,
      urgency,
      customerEmail,
      customerPhone: formattedPhone,
      serviceProviderEmail,
      status: 'pending',
      emailStatus: {
        sent: false,
        trackingId,
        calendarInvite: {
          sent: false,
          status: 'pending'
        }
      }
    });

    await appointment.save();

    // Send SMS confirmation request
    try {
      const message = `Your oil change appointment is scheduled for ${appointmentDate.toLocaleString()}. Please reply with Y to confirm or N to cancel.`;
      await sendSMS(customerPhone, message);
    } catch (smsError) {
      console.error('Error sending SMS confirmation request:', smsError);
      // Continue with the response even if SMS fails
    }

    // Send email to customer
    try {
      // Prepare email content
      const emailHtml = `
        <h2>Your Oil Change Appointment is Scheduled</h2>
        <p>Vehicle: ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.year}</p>
        <p>Date: ${preferredDate}</p>
        <p>Time: ${preferredTime}</p>
        <p>Service Address: ${serviceAddress}</p>
        <p>Tracking ID: ${trackingId}</p>
        <p>You can track your appointment status at: ${process.env.FRONTEND_URL}/appointment/${trackingId}</p>
      `;

      const emailResult = await sendEmail({
        to: customerEmail,
        subject: 'Oil Change Appointment Confirmation',
        html: emailHtml,
        attachments: [{
          filename: 'appointment.ics',
          content: calendar.toString()
        }]
      });

      // Update email status
      appointment.emailStatus.sent = true;
      appointment.emailStatus.calendarInvite.sent = true;
      appointment.emailStatus.messageId = emailResult.messageId;
      appointment.emailStatus.previewUrl = emailResult.previewUrl;
      await appointment.save();
      
      console.log('Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      success: true,
      trackingId,
      message: 'Appointment scheduled successfully'
    });

  } catch (error) {
    console.error('Error scheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling appointment',
      error: error.message
    });
  }
});

// Endpoint to handle calendar invite responses
router.post('/calendar-response/:trackingId', async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await OilChange.findOne({ 'emailStatus.trackingId': req.params.trackingId });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!['accepted', 'declined', 'tentative'].includes(status)) {
      return res.status(400).json({ message: 'Invalid calendar response status' });
    }

    appointment.emailStatus.calendarInvite.status = status;
    appointment.emailStatus.calendarInvite.respondedAt = new Date();
    
    // If the calendar invite is accepted, also mark the appointment as acknowledged
    if (status === 'accepted') {
      appointment.emailStatus.acknowledged = true;
      appointment.emailStatus.acknowledgedAt = new Date();
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Calendar response recorded successfully',
      appointment: {
        date: appointment.appointmentDate,
        vehicle: `${appointment.vehicleInfo.make} ${appointment.vehicleInfo.model} ${appointment.vehicleInfo.year}`,
        address: appointment.serviceAddress,
        calendarStatus: appointment.emailStatus.calendarInvite.status
      }
    });
  } catch (error) {
    console.error('Error recording calendar response:', error);
    res.status(500).json({ message: 'Failed to record calendar response' });
  }
});

// Endpoint to acknowledge appointment
router.get('/confirm/:trackingId', async (req, res) => {
  try {
    const appointment = await OilChange.findOne({ 'emailStatus.trackingId': req.params.trackingId });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.emailStatus.acknowledged = true;
    appointment.emailStatus.acknowledgedAt = new Date();
    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      appointment: {
        date: appointment.appointmentDate,
        vehicle: `${appointment.vehicleInfo.make} ${appointment.vehicleInfo.model} ${appointment.vehicleInfo.year}`,
        address: appointment.serviceAddress,
        calendarStatus: appointment.emailStatus.calendarInvite.status
      }
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({ message: 'Failed to confirm appointment' });
  }
});

// Endpoint to check appointment status
router.get('/status/:trackingId', async (req, res) => {
  try {
    const appointment = await OilChange.findOne({ 'emailStatus.trackingId': req.params.trackingId });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      emailSent: appointment.emailStatus.sent,
      acknowledged: appointment.emailStatus.acknowledged,
      acknowledgedAt: appointment.emailStatus.acknowledgedAt,
      calendarInvite: {
        sent: appointment.emailStatus.calendarInvite.sent,
        status: appointment.emailStatus.calendarInvite.status,
        respondedAt: appointment.emailStatus.calendarInvite.respondedAt
      },
      appointment: {
        date: appointment.appointmentDate,
        vehicle: `${appointment.vehicleInfo.make} ${appointment.vehicleInfo.model} ${appointment.vehicleInfo.year}`,
        address: appointment.serviceAddress
      }
    });
  } catch (error) {
    console.error('Error checking appointment status:', error);
    res.status(500).json({ message: 'Failed to check appointment status' });
  }
});

module.exports = router; 
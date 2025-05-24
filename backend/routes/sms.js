const express = require('express');
const router = express.Router();
const { sendSMS, validatePhoneNumber } = require('../config/vonage');
const OilChange = require('../models/OilChange');

// Test endpoint for sending SMS
router.post('/test', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and message are required'
      });
    }

    console.log('Attempting to send test SMS...');
    console.log('To:', phoneNumber);
    console.log('Message:', message);

    const formattedPhone = validatePhoneNumber(phoneNumber);
    const response = await sendSMS(formattedPhone, message);

    res.json({
      success: true,
      message: 'Test SMS sent successfully',
      response
    });
  } catch (error) {
    console.error('Error in test SMS route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS',
      error: error.message
    });
  }
});

// Handle incoming SMS responses
router.post('/webhook', async (req, res) => {
  try {
    const { msisdn, text, messageId } = req.body;
    console.log('Received SMS webhook:', { msisdn, text, messageId });

    // Find the most recent pending appointment for this phone number
    const appointment = await OilChange.findOne({
      customerPhone: msisdn,
      'emailStatus.acknowledged': false
    }).sort({ createdAt: -1 });

    if (!appointment) {
      console.log('No pending appointment found for:', msisdn);
      return res.status(404).json({
        success: false,
        message: 'No pending appointment found'
      });
    }

    const response = text.trim().toUpperCase();

    if (response === 'Y' || response === 'YES') {
      // Update appointment status
      appointment.emailStatus.acknowledged = true;
      appointment.emailStatus.acknowledgedAt = new Date();
      appointment.emailStatus.calendarInvite.status = 'accepted';
      await appointment.save();

      // Send confirmation SMS
      const confirmationMessage = `Thank you for confirming your appointment! We'll send you a reminder 24 hours before your scheduled time (${appointment.appointmentDate.toLocaleString()}). If you need to make any changes, please call us at ${process.env.VONAGE_PHONE_NUMBER}.`;
      await sendSMS(msisdn, confirmationMessage);

      return res.json({
        success: true,
        message: 'Appointment confirmed'
      });
    } else if (response === 'N' || response === 'NO') {
      // Update appointment status
      appointment.emailStatus.calendarInvite.status = 'declined';
      await appointment.save();

      // Send cancellation SMS
      const cancellationMessage = 'Your appointment has been cancelled. Please call us to reschedule at your convenience.';
      await sendSMS(msisdn, cancellationMessage);

      return res.json({
        success: true,
        message: 'Appointment cancelled'
      });
    } else {
      // Send invalid response SMS
      const invalidMessage = 'Invalid response. Please reply with Y to confirm or N to cancel.';
      await sendSMS(msisdn, invalidMessage);

      return res.status(400).json({
        success: false,
        message: 'Invalid response'
      });
    }
  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing SMS response',
      error: error.message
    });
  }
});

// Send appointment confirmation request
router.post('/send-confirmation', async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await OilChange.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const message = `Your oil change appointment is scheduled for ${appointment.appointmentDate.toLocaleString()}. Please reply with Y to confirm or N to cancel.`;
    await sendSMS(appointment.customerPhone, message);

    res.json({
      success: true,
      message: 'Confirmation request sent successfully'
    });
  } catch (error) {
    console.error('Error sending confirmation request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation request',
      error: error.message
    });
  }
});

module.exports = router; 
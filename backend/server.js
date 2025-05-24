const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const ical = require('ical-generator');
const oilChangesRouter = require('./routes/oilChanges');
const smsRouter = require('./routes/sms');
const morgan = require('morgan');

// Load environment variables
dotenv.config({ path: __dirname + '/.env' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // HTTP request logger

// Request body logging middleware
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('========================\n');
  next();
});

// Log environment variables (excluding sensitive data)
console.log('\n=== Environment Variables Status ===');
console.log('Server Configuration:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\nDatabase Configuration:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');

console.log('\nFrontend Configuration:');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

console.log('\nEmail Configuration:');
console.log('MAILTRAP_HOST:', process.env.MAILTRAP_HOST ? 'Set' : 'Not set');
console.log('MAILTRAP_PORT:', process.env.MAILTRAP_PORT ? 'Set' : 'Not set');
console.log('MAILTRAP_USER:', process.env.MAILTRAP_USER ? 'Set' : 'Not set');
console.log('MAILTRAP_PASS:', process.env.MAILTRAP_PASS ? 'Set' : 'Not set');

console.log('\nVonage Configuration:');
console.log('VONAGE_API_KEY:', process.env.VONAGE_API_KEY ? 'Set' : 'Not set');
console.log('VONAGE_API_SECRET:', process.env.VONAGE_API_SECRET ? 'Set' : 'Not set');
console.log('VONAGE_PHONE_NUMBER:', process.env.VONAGE_PHONE_NUMBER ? 'Set' : 'Not set');
console.log('VONAGE_APPLICATION_ID:', process.env.VONAGE_APPLICATION_ID ? 'Set' : 'Not set');
console.log('VONAGE_PRIVATE_KEY:', process.env.VONAGE_PRIVATE_KEY ? 'Set' : 'Not set');

console.log('\nTwilio Configuration:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? 'Set' : 'Not set');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? 'Set' : 'Not set');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER ? 'Set' : 'Not set');
console.log('================================\n');

// Routes
app.use('/api/oil-changes', oilChangesRouter);
app.use('/api/sms', smsRouter);

// API endpoint to save oil change appointment
app.post('/api/oil-changes', async (req, res) => {
  try {
    const appointment = new OilChange(req.body);
    await appointment.save();

    // Create calendar invite
    const calendarInvite = createCalendarInvite(appointment);

    // Send email to customer if transporter is configured
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: appointment.email,
          subject: 'HomeLube Oil Change Appointment Confirmation',
          text: `Thank you for scheduling your oil change with HomeLube!\n\nAppointment Details:\nDate: ${appointment.scheduledDate}\nVehicle: ${appointment.year} ${appointment.make} ${appointment.model}\nAddress: ${appointment.address.street}\nZip Code: ${appointment.address.zipCode}\nUrgency: ${appointment.urgency}\n\nA calendar invite has been attached to this email.`,
          attachments: [{
            filename: 'invite.ics',
            content: calendarInvite
          }]
        });

        // Send email to service provider
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_USER,
          subject: 'New HomeLube Oil Change Appointment',
          text: `New appointment scheduled:\n\nCustomer Email: ${appointment.email}\nDate: ${appointment.scheduledDate}\nVehicle: ${appointment.year} ${appointment.make} ${appointment.model}\nAddress: ${appointment.address.street}\nZip Code: ${appointment.address.zipCode}\nUrgency: ${appointment.urgency}`,
          attachments: [{
            filename: 'invite.ics',
            content: calendarInvite
          }]
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue with the response even if email fails
      }
    } else {
      console.warn('Email notifications disabled: transporter not configured');
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error saving appointment:', error);
    res.status(500).json({ error: 'Failed to save appointment' });
  }
});

// API endpoint to update satisfaction
app.put('/api/oil-changes/:id/satisfaction', async (req, res) => {
  try {
    const appointment = await OilChange.findByIdAndUpdate(
      req.params.id,
      { satisfaction: req.body.satisfaction },
      { new: true }
    );
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update satisfaction' });
  }
});

// Function to create calendar invite
const createCalendarInvite = (appointment) => {
  const event = {
    start: appointment.scheduledDate,
    end: new Date(appointment.scheduledDate.getTime() + 60 * 60 * 1000), // 1 hour duration
    summary: 'HomeLube Oil Change Appointment',
    description: `Vehicle: ${appointment.year} ${appointment.make} ${appointment.model}\nEngine: ${appointment.engine}\nMileage: ${appointment.mileage}\nAddress: ${appointment.address.street}\nZip Code: ${appointment.address.zipCode}\nUrgency: ${appointment.urgency}`,
    location: {
      title: 'Service Location',
      address: appointment.address.street,
      geo: { lat: 0, lon: 0 }
    },
    organizer: { name: 'HomeLube', email: process.env.EMAIL_USER },
    attendees: [
      { email: appointment.email, rsvp: true },
      { email: process.env.EMAIL_USER, rsvp: true }
    ]
  };

  return ical.asString(event);
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== Error Details ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Request Body:', req.body);
  console.error('Request URL:', req.url);
  console.error('Request Method:', req.method);
  console.error('========================\n');
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start server after successful database connection
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('\n=== Unhandled Promise Rejection ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  console.error('================================\n');
  // Don't exit the process in production
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
}); 
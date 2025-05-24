const mongoose = require('mongoose');

const oilChangeSchema = new mongoose.Schema({
  trackingId: {
    type: String,
    required: true,
    unique: true
  },
  vehicleInfo: {
    make: String,
    model: String,
    year: String,
    licensePlate: String
  },
  serviceAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  urgency: {
    type: String,
    enum: ['routine', 'urgent', 'emergency'],
    default: 'routine'
  },
  customerEmail: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  customerPhone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  serviceProviderEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  emailStatus: {
    sent: {
      type: Boolean,
      default: false
    },
    trackingId: String,
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date,
    calendarInvite: {
      sent: {
        type: Boolean,
        default: false
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
oilChangeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('OilChange', oilChangeSchema); 
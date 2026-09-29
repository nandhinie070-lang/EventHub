const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    ticketCode: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'attended'],
      default: 'confirmed'
    },
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: {
      type: Date
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    customFieldResponses: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    registrationDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate registrations for same user and event
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);

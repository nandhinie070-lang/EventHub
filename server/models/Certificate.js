const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: true
    },
    recipientName: {
      type: String,
      required: true
    },
    eventTitle: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      default: Date.now
    },
    verificationHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate certificates for same user & event
certificateSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Certificate', certificateSchema);

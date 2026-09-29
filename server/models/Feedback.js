const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      required: [true, 'Registration reference is required']
    },
    rating: {
      type: Number,
      required: [true, 'Star rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5']
    },
    comment: {
      type: String,
      required: [true, 'Feedback comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// One feedback per user per event
feedbackSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

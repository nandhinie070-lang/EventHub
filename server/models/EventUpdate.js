const mongoose = require('mongoose');

const eventUpdateSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user reference is required']
    },
    category: {
      type: String,
      enum: ['venue', 'time', 'lunch', 'refreshments', 'other'],
      required: [true, 'Update category is required']
    },
    title: {
      type: String,
      required: [true, 'Update title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    message: {
      type: String,
      required: [true, 'Update message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters']
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EventUpdate', eventUpdateSchema);

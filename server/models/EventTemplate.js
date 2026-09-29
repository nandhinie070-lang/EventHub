const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Field name identifier is required'],
    trim: true
  },
  label: {
    type: String,
    required: [true, 'Field label is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'url'],
    default: 'text',
    required: true
  },
  required: {
    type: Boolean,
    default: false
  },
  options: [
    {
      type: String,
      trim: true
    }
  ],
  placeholder: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    enum: ['event', 'registration', 'both'],
    default: 'registration'
  },
  description: {
    type: String,
    default: ''
  }
});

const eventTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      unique: true,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Other'],
      default: 'Technical'
    },
    description: {
      type: String,
      required: [true, 'Template description is required']
    },
    customFields: [customFieldSchema],
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('EventTemplate', eventTemplateSchema);

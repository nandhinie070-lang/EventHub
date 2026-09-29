const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
      index: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
      index: true
    },
    category: {
      type: String,
      enum: ['food', 'seating', 'venue', 'audio-visual', 'cleanliness', 'other'],
      required: [true, 'Issue category is required'],
      index: true
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    photoUrl: {
      type: String,
      default: ''
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    stage: {
      type: String,
      enum: ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Confirmed'],
      default: 'Reported',
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    slaDeadline: {
      type: Date,
      required: true
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true
    },
    escalatedAt: {
      type: Date
    },
    escalationReason: {
      type: String,
      default: ''
    },
    reopenCount: {
      type: Number,
      default: 0
    },
    reopenReason: {
      type: String,
      default: ''
    },
    stageHistory: [
      {
        stage: {
          type: String,
          required: true
        },
        changedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        notes: {
          type: String,
          default: ''
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Method to compute SLA deadline for a given stage
issueSchema.statics.computeSlaDeadline = function (stage) {
  const now = Date.now();
  switch (stage) {
    case 'Reported':
      return new Date(now + 15 * 60 * 1000); // 15 mins to acknowledge
    case 'Acknowledged':
      return new Date(now + 25 * 60 * 1000); // 25 mins to assign
    case 'Assigned':
      return new Date(now + 30 * 60 * 1000); // 30 mins to begin work
    case 'In Progress':
      return new Date(now + 90 * 60 * 1000); // 90 mins to resolve
    default:
      return new Date(now + 60 * 60 * 1000);
  }
};

module.exports = mongoose.model('Issue', issueSchema);

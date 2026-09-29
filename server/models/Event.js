const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      required: [true, 'Please provide event description']
    },
    category: {
      type: String,
      enum: ['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon', 'Other'],
      default: 'Technical',
      required: true
    },
    department: {
      type: String,
      required: [true, 'Please specify the organizing department'],
      trim: true
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coOrganizers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    startDate: {
      type: Date,
      required: [true, 'Please specify start date and time']
    },
    endDate: {
      type: Date,
      required: [true, 'Please specify end date and time']
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Please specify registration deadline']
    },
    venueMode: {
      type: String,
      enum: ['offline', 'online', 'hybrid'],
      default: 'offline'
    },
    venueLocation: {
      type: String,
      required: [true, 'Please provide venue location or meeting URL'],
      trim: true
    },
    bannerUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80'
    },
    capacity: {
      type: Number,
      default: 100,
      min: [1, 'Capacity must be at least 1']
    },
    registeredCount: {
      type: Number,
      default: 0
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    fee: {
      type: Number,
      default: 0
    },
    allowedUserTypes: {
      type: [String],
      enum: ['internal', 'external'],
      default: ['internal', 'external']
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EventTemplate'
    },
    customFieldResponses: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    attendanceWindow: {
      bufferMinutesBefore: {
        type: Number,
        default: 60
      },
      bufferMinutesAfter: {
        type: Number,
        default: 60
      },
      customStart: {
        type: Date
      },
      customEnd: {
        type: Date
      }
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_hod',
        'pending_principal',
        'approved',
        'rejected',
        'cancelled',
        'completed'
      ],
      default: 'pending_hod'
    },
    // Multi-tier approvals track
    approvals: {
      hod: {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reviewedAt: {
          type: Date
        },
        remarks: {
          type: String,
          default: ''
        }
      },
      principal: {
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending'
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        reviewedAt: {
          type: Date
        },
        remarks: {
          type: String,
          default: ''
        }
      }
    },
    budget: {
      estimated: {
        type: Number,
        default: 0
      },
      breakdown: {
        type: String,
        default: ''
      }
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching and filtering
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ status: 1, department: 1, startDate: 1 });

module.exports = mongoose.model('Event', eventSchema);

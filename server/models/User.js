const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    passwordHash: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'organizer', 'hod', 'principal', 'admin'],
      default: 'student'
    },
    userType: {
      type: String,
      enum: ['internal', 'external'],
      required: [true, 'Please specify user type (internal or external)']
    },
    // Fields for internal college users
    rollNo: {
      type: String,
      trim: true,
      sparse: true
    },
    department: {
      type: String,
      trim: true
    },
    year: {
      type: String,
      trim: true
    },
    // Fields for external college users
    collegeName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    idCardUrl: {
      type: String,
      default: ''
    },
    // Account verification & status
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // OTP verification fields
    otp: {
      type: String,
      default: null,
      select: false
    },
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainPassword, salt);
};

module.exports = mongoose.model('User', userSchema);

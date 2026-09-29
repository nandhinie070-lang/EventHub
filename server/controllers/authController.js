const User = require('../models/User');
const collegeConfig = require('../config/college');
const generateToken = require('../utils/generateToken');
const { sendOtpEmail } = require('../utils/emailService');

// Helper to format user response (omit sensitive fields)
const sanitizeUser = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    userType: user.userType,
    rollNo: user.rollNo,
    department: user.department,
    year: user.year,
    collegeName: user.collegeName,
    phone: user.phone,
    idCardUrl: user.idCardUrl,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
};

// @desc    Register a new user (internal or external)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      userType,
      rollNo,
      department,
      year,
      collegeName,
      phone,
      idCardUrl
    } = req.body;

    // Basic validation
    if (!name || !email || !password || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and user type are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Domain validation for internal users
    if (userType === 'internal') {
      const expectedDomain = collegeConfig.domain.toLowerCase();
      const emailDomain = normalizedEmail.split('@')[1];
      if (!emailDomain || emailDomain !== expectedDomain) {
        return res.status(400).json({
          success: false,
          message: `Internal members must use the official college email domain (@${collegeConfig.domain}).`
        });
      }

      if (!rollNo || !department || !year) {
        return res.status(400).json({
          success: false,
          message: 'Roll number, department, and year are required for college students/staff.'
        });
      }
    } else if (userType === 'external') {
      if (!collegeName || !phone) {
        return res.status(400).json({
          success: false,
          message: 'College/Organization name and phone number are required for external participants.'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Allowed values: internal, external.'
      });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists and is verified. Please log in.'
        });
      }

      // If existing user is not verified, update details, generate fresh OTP, and allow re-verification
      const passwordHash = await User.hashPassword(password);
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      existingUser.name = name;
      existingUser.passwordHash = passwordHash;
      existingUser.userType = userType;
      existingUser.rollNo = rollNo || existingUser.rollNo;
      existingUser.department = department || existingUser.department;
      existingUser.year = year || existingUser.year;
      existingUser.collegeName = collegeName || existingUser.collegeName;
      existingUser.phone = phone || existingUser.phone;
      existingUser.idCardUrl = idCardUrl || existingUser.idCardUrl;
      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;

      await existingUser.save();
      await sendOtpEmail(normalizedEmail, otp, name);

      return res.status(200).json({
        success: true,
        message: 'Verification OTP sent to your email.',
        email: normalizedEmail,
        userType,
        otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    // Hash password & generate OTP
    const passwordHash = await User.hashPassword(password);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: 'student', // Default registration role
      userType,
      rollNo: userType === 'internal' ? rollNo : undefined,
      department: userType === 'internal' ? department : undefined,
      year: userType === 'internal' ? year : undefined,
      collegeName: userType === 'external' ? collegeName : collegeConfig.name,
      phone: userType === 'external' ? phone : undefined,
      idCardUrl: userType === 'external' ? idCardUrl : '',
      isVerified: false,
      isActive: true,
      otp,
      otpExpiresAt
    });

    await sendOtpEmail(normalizedEmail, otp, name);

    res.status(201).json({
      success: true,
      message: 'Registration initiated. Verification OTP sent to your email.',
      email: newUser.email,
      userType: newUser.userType,
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit OTP code are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.isVerified) {
      const token = generateToken(user);
      return res.status(200).json({
        success: true,
        message: 'Account is already verified.',
        token,
        user: sanitizeUser(user)
      });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'No pending OTP found. Please request a new code.'
      });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.'
      });
    }

    if (user.otp.trim() !== otp.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.'
      });
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Account verified successfully!',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP code
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otp +otpExpiresAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account is already verified. Please log in.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(normalizedEmail, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'New OTP has been sent to your email.',
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.'
      });
    }

    if (!user.isVerified) {
      // Send fresh OTP and notify frontend to navigate to verify screen
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(normalizedEmail, otp, user.name);

      return res.status(403).json({
        success: false,
        unverified: true,
        email: normalizedEmail,
        message: 'Account not verified. A new OTP has been sent to your email.',
        otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private (protect middleware)
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get college configuration metadata for public registration
// @route   GET /api/auth/college-config
// @access  Public
const getCollegeConfig = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      college: {
        name: collegeConfig.name,
        shortName: collegeConfig.shortName,
        domain: collegeConfig.domain,
        departments: collegeConfig.departments,
        years: collegeConfig.years
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  getCollegeConfig
};

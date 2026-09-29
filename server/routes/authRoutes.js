const express = require('express');
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  getCollegeConfig
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.get('/college-config', getCollegeConfig);
router.get('/me', protect, getMe);

module.exports = router;

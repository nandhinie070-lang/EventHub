const express = require('express');
const router = express.Router();
const {
  getMyCoupons,
  redeemCoupon,
  getFoodStats
} = require('../controllers/foodCouponController');
const { protect } = require('../middleware/authMiddleware');

// Student: view my food and refreshment coupons
router.get('/my-coupons', protect, getMyCoupons);

// Volunteer/Organizer: scan and redeem coupon
router.post('/redeem', protect, redeemCoupon);

// Organizer/Admin: live food count and redemption statistics
router.get('/stats/:eventId', protect, getFoodStats);

module.exports = router;

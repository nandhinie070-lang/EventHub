const crypto = require('crypto');
const qrcode = require('qrcode');
const FoodCoupon = require('../models/FoodCoupon');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');

// Helper to generate unique coupon code
const generateCouponCode = (type) => {
  const prefix = type === 'lunch' ? 'LUNCH' : 'REFR';
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `FC-${prefix}-${year}-${randomPart}`;
};

// Helper to ensure lunch and refreshment coupons exist for a registration
const ensureCouponsForRegistration = async (registrationId, userId, eventId) => {
  const types = ['lunch', 'refreshment'];
  const coupons = [];

  for (const type of types) {
    let coupon = await FoodCoupon.findOne({
      event: eventId,
      user: userId,
      couponType: type
    });

    if (!coupon) {
      let code = generateCouponCode(type);
      let isUnique = false;
      while (!isUnique) {
        const existing = await FoodCoupon.findOne({ couponCode: code });
        if (!existing) {
          isUnique = true;
        } else {
          code = generateCouponCode(type);
        }
      }

      const qrCodeDataUrl = await qrcode.toDataURL(code, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 300,
        color: {
          dark: type === 'lunch' ? '#b45309' : '#047857',
          light: '#ffffff'
        }
      });

      coupon = await FoodCoupon.create({
        event: eventId,
        user: userId,
        registration: registrationId,
        couponType: type,
        couponCode: code,
        qrCodeDataUrl,
        isRedeemed: false
      });
    }

    coupons.push(coupon);
  }

  return coupons;
};

// @desc    Get all food coupons for logged-in user
// @route   GET /api/food-coupons/my-coupons
// @access  Private
const getMyCoupons = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find all confirmed registrations for this user
    const registrations = await Registration.find({ user: userId });

    // Ensure coupons exist for all registrations
    for (const reg of registrations) {
      await ensureCouponsForRegistration(reg._id, userId, reg.event);
    }

    const coupons = await FoodCoupon.find({ user: userId })
      .populate('event', 'title category department startDate endDate venueLocation')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Volunteer scan & redeem food coupon
// @route   POST /api/food-coupons/redeem
// @access  Private (volunteers, organizers, admins)
const redeemCoupon = async (req, res, next) => {
  try {
    const { couponCode } = req.body;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required for redemption.'
      });
    }

    const cleanCode = couponCode.trim().toUpperCase();

    const coupon = await FoodCoupon.findOne({ couponCode: cleanCode })
      .populate('user', 'name rollNo department collegeName')
      .populate('event', 'title venueLocation startDate')
      .populate('redeemedBy', 'name');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code. No coupon found matching this code.'
      });
    }

    // Check if already redeemed
    if (coupon.isRedeemed) {
      const redeemedTime = new Date(coupon.redeemedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
      const redeemedDate = new Date(coupon.redeemedAt).toLocaleDateString();

      return res.status(400).json({
        success: false,
        isAlreadyRedeemed: true,
        message: `Already redeemed at ${redeemedTime} on ${redeemedDate}.`,
        coupon: {
          couponCode: coupon.couponCode,
          couponType: coupon.couponType,
          recipientName: coupon.user?.name,
          rollNo: coupon.user?.rollNo || coupon.user?.collegeName,
          eventTitle: coupon.event?.title,
          redeemedAt: coupon.redeemedAt,
          redeemedBy: coupon.redeemedBy?.name || 'Volunteer'
        }
      });
    }

    // Mark as redeemed
    coupon.isRedeemed = true;
    coupon.redeemedAt = new Date();
    coupon.redeemedBy = req.user._id;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Success! ${coupon.couponType.toUpperCase()} coupon redeemed for ${coupon.user?.name}.`,
      coupon: {
        couponCode: coupon.couponCode,
        couponType: coupon.couponType,
        recipientName: coupon.user?.name,
        rollNo: coupon.user?.rollNo || coupon.user?.collegeName,
        eventTitle: coupon.event?.title,
        redeemedAt: coupon.redeemedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live food count & stats for organizers
// @route   GET /api/food-coupons/stats/:eventId
// @access  Private (organizers, admins)
const getFoodStats = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Lunch counts
    const totalLunch = await FoodCoupon.countDocuments({
      event: eventId,
      couponType: 'lunch'
    });
    const redeemedLunch = await FoodCoupon.countDocuments({
      event: eventId,
      couponType: 'lunch',
      isRedeemed: true
    });
    const remainingLunch = totalLunch - redeemedLunch;

    // Refreshment counts
    const totalRefr = await FoodCoupon.countDocuments({
      event: eventId,
      couponType: 'refreshment'
    });
    const redeemedRefr = await FoodCoupon.countDocuments({
      event: eventId,
      couponType: 'refreshment',
      isRedeemed: true
    });
    const remainingRefr = totalRefr - redeemedRefr;

    // Recent 15 redemptions
    const recentRedemptions = await FoodCoupon.find({
      event: eventId,
      isRedeemed: true
    })
      .populate('user', 'name rollNo department')
      .populate('redeemedBy', 'name')
      .sort({ redeemedAt: -1 })
      .limit(15);

    res.status(200).json({
      success: true,
      eventTitle: event.title,
      lunch: {
        total: totalLunch,
        redeemed: redeemedLunch,
        remaining: remainingLunch,
        percentage: totalLunch > 0 ? Math.round((redeemedLunch / totalLunch) * 100) : 0
      },
      refreshment: {
        total: totalRefr,
        redeemed: redeemedRefr,
        remaining: remainingRefr,
        percentage: totalRefr > 0 ? Math.round((redeemedRefr / totalRefr) * 100) : 0
      },
      recentRedemptions: recentRedemptions.map((c) => ({
        id: c._id,
        couponCode: c.couponCode,
        couponType: c.couponType,
        recipientName: c.user?.name,
        rollNo: c.user?.rollNo,
        redeemedAt: c.redeemedAt,
        redeemedBy: c.redeemedBy?.name
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyCoupons,
  redeemCoupon,
  getFoodStats,
  ensureCouponsForRegistration
};

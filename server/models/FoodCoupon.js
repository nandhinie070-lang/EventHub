const mongoose = require('mongoose');

const foodCouponSchema = new mongoose.Schema(
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
    couponType: {
      type: String,
      enum: ['lunch', 'refreshment'],
      required: [true, 'Coupon type (lunch / refreshment) is required']
    },
    couponCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    qrCodeDataUrl: {
      type: String,
      required: true
    },
    isRedeemed: {
      type: Boolean,
      default: false,
      index: true
    },
    redeemedAt: {
      type: Date
    },
    redeemedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// One coupon of each type per user per event
foodCouponSchema.index({ event: 1, user: 1, couponType: 1 }, { unique: true });

module.exports = mongoose.model('FoodCoupon', foodCouponSchema);

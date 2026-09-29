const express = require('express');
const router = express.Router();
const { getAnalyticsOverview } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get(
  '/overview',
  protect,
  authorize('hod', 'principal', 'admin', 'organizer'),
  getAnalyticsOverview
);

module.exports = router;

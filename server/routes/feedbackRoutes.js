const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getMyEventFeedback,
  getEventFeedback
} = require('../controllers/feedbackController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view feedback/reviews for an event
router.get('/event/:eventId', getEventFeedback);

// Authenticated routes
router.get('/my/:eventId', protect, getMyEventFeedback);
router.post('/:eventId', protect, submitFeedback);

module.exports = router;

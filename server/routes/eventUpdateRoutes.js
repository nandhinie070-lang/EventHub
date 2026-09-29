const express = require('express');
const router = express.Router();
const {
  createUpdate,
  getEventUpdates,
  deleteUpdate
} = require('../controllers/eventUpdateController');
const { protect } = require('../middleware/authMiddleware');

// Public route to view timeline of updates for an event
router.get('/:eventId', getEventUpdates);

// Private routes for organizers to broadcast and manage updates
router.post('/:eventId', protect, createUpdate);
router.delete('/:updateId', protect, deleteUpdate);

module.exports = router;

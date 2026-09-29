const express = require('express');
const router = express.Router();
const {
  createIssue,
  getEventIssues,
  getMyIssues,
  updateIssueStage,
  reopenIssue,
  getEscalatedIssues
} = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Student: view my reported issues
router.get('/my', protect, getMyIssues);

// Admin: view all escalated issues across campus events
router.get('/escalated', protect, authorize('admin', 'principal'), getEscalatedIssues);

// Coordinator/Staff: view event issues
router.get('/event/:eventId', protect, getEventIssues);

// Attendee: submit an issue report
router.post('/:eventId', protect, createIssue);

// Coordinator: advance issue stage
router.patch('/:issueId/stage', protect, updateIssueStage);

// Student: reopen resolved issue
router.patch('/:issueId/reopen', protect, reopenIssue);

module.exports = router;

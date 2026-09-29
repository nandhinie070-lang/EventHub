const express = require('express');
const router = express.Router();
const {
  registerForEvent,
  getMyTickets,
  getTicketByCode,
  getRotatingQr,
  getEventAttendees,
  checkInAttendee,
  downloadOdLetter
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register/:eventId', protect, registerForEvent);
router.get('/my-tickets', protect, getMyTickets);
router.get('/ticket/:ticketCode', protect, getTicketByCode);
router.get('/ticket/:ticketCode/rotating-qr', protect, getRotatingQr);
router.get('/od-letter/:eventId', protect, downloadOdLetter);
router.get('/event/:eventId/attendees', protect, authorize('organizer', 'admin', 'hod', 'principal'), getEventAttendees);
router.post('/check-in', protect, authorize('organizer', 'admin', 'principal'), checkInAttendee);

module.exports = router;

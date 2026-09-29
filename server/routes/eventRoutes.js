const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  approveHod,
  approvePrincipal,
  getPendingApprovals,
  downloadEventReportPDF,
  checkVenueClashEndpoint
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public / Authenticated read routes
router.get('/', (req, res, next) => {
  // Try to populate user if token exists, but don't block if not provided
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return protect(req, res, () => getEvents(req, res, next));
  }
  return getEvents(req, res, next);
});

router.get('/pending-approvals', protect, authorize('hod', 'principal', 'admin'), getPendingApprovals);
router.post('/check-venue-clash', protect, authorize('organizer', 'admin', 'principal', 'hod'), checkVenueClashEndpoint);
router.get('/:id/report-pdf', protect, authorize('organizer', 'hod', 'principal', 'admin'), downloadEventReportPDF);
router.get('/:id', getEventById);

// Protected mutation routes
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.put('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

// Multi-tier approval endpoints
router.patch('/:id/approve-hod', protect, authorize('hod', 'admin'), approveHod);
router.patch('/:id/approve-principal', protect, authorize('principal', 'admin'), approvePrincipal);

module.exports = router;

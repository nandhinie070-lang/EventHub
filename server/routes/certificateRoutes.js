const express = require('express');
const router = express.Router();
const {
  getMyCertificates,
  claimCertificate,
  generateCertificates,
  downloadCertificate,
  verifyCertificate
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-certificates', protect, getMyCertificates);
router.post('/claim/:eventId', protect, claimCertificate);
router.post('/generate/:eventId', protect, authorize('organizer', 'admin'), generateCertificates);
router.get('/download/:certificateId', downloadCertificate);
router.get('/verify/:certificateId', verifyCertificate);

module.exports = router;

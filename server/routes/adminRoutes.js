const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getSystemLogs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/logs', getSystemLogs);

module.exports = router;

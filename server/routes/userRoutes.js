const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  toggleUserStatus
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All user management routes require admin access
router.use(protect);
router.use(authorize('admin'));

router.get('/', getAllUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/eventTemplateController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getTemplates);
router.get('/:id', getTemplateById);
router.post('/', protect, authorize('admin'), createTemplate);
router.put('/:id', protect, authorize('admin'), updateTemplate);
router.delete('/:id', protect, authorize('admin'), deleteTemplate);

module.exports = router;

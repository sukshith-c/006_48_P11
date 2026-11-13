const express = require('express');
const router = express.Router();
const { getHandlers, getHandlerById, updateAvailability, updateCapacity } = require('../controllers/handlerController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/', protect, authorize('admin', 'handler'), getHandlers);
router.get('/:id', protect, getHandlerById);
router.put('/:id/availability', protect, authorize('handler', 'admin'), updateAvailability);
router.put('/:id/capacity', protect, authorize('admin'), updateCapacity);

module.exports = router;

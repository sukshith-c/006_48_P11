const express = require('express');
const router = express.Router();
const { getZones, getRoutingTable, getQueue, getDecisions, manualDispatch, updateZone } = require('../controllers/routingController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.get('/zones', protect, authorize('admin'), getZones);
router.get('/table', protect, authorize('admin'), getRoutingTable);
router.get('/queue', protect, authorize('admin'), getQueue);
router.get('/decisions', protect, authorize('admin'), getDecisions);
router.post('/dispatch', protect, authorize('admin'), manualDispatch);
router.put('/zones/:id', protect, authorize('admin'), updateZone);

module.exports = router;

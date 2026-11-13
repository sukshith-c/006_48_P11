const express = require('express');
const router = express.Router();
const { getSummary, getCategoryDistribution, getZoneDistribution, getStatusDistribution, getHandlerWorkload } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getSummary);
router.get('/categories', protect, getCategoryDistribution);
router.get('/zones', protect, getZoneDistribution);
router.get('/status', protect, getStatusDistribution);
router.get('/handlers', protect, getHandlerWorkload);

module.exports = router;

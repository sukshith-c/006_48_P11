const express = require('express');
const router = express.Router();
const { runTests, getTestResults } = require('../controllers/testController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.post('/run', protect, authorize('admin'), runTests);
router.get('/results', protect, getTestResults);

module.exports = router;

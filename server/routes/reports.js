const express = require('express');
const router = express.Router();
const { submitReport, getReports, getReportById, searchByReportId, updateStatus } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

router.post('/', protect, authorize('inspector', 'admin'), submitReport);
router.get('/', protect, getReports);
router.get('/search/:reportId', protect, searchByReportId);
router.get('/:id', protect, getReportById);
router.put('/:id/status', protect, authorize('handler', 'admin'), updateStatus);

module.exports = router;

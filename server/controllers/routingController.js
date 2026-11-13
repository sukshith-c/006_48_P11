const Zone = require('../models/Zone');
const Handler = require('../models/Handler');
const Report = require('../models/Report');
const RoutingDecision = require('../models/RoutingDecision');
const { dispatchReport } = require('../services/dispatchService');

// @desc    Get all zones
// @route   GET /api/routing/zones
// @access  Private (Admin)
const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find()
      .populate('primaryOfficer', 'fullName handlerId isAvailable currentOpenCases maxCapacity')
      .populate('deputyOfficer', 'fullName handlerId isAvailable currentOpenCases maxCapacity');
    res.json({ success: true, zones });
  } catch (error) {
    next(error);
  }
};

// @desc    Get routing table
// @route   GET /api/routing/table
// @access  Private (Admin)
const getRoutingTable = async (req, res, next) => {
  try {
    const zones = await Zone.find()
      .populate('primaryOfficer', 'fullName handlerId isAvailable currentOpenCases maxCapacity')
      .populate('deputyOfficer', 'fullName handlerId isAvailable currentOpenCases maxCapacity');

    const table = zones.map(z => ({
      zoneId: z.zoneId,
      zoneName: z.zoneName,
      pinCodeRange: `${z.pinCodeRangeStart} - ${z.pinCodeRangeEnd}`,
      pinCodePrefix: z.pinCodePrefix,
      primaryOfficer: z.primaryOfficer,
      deputyOfficer: z.deputyOfficer,
      currentOpenCases: z.currentOpenCases,
      maxCapacity: z.maxCapacity,
      isActive: z.isActive,
      routingStatus: z.isActive ? 'Active' : 'Inactive'
    }));

    res.json({ success: true, table });
  } catch (error) {
    next(error);
  }
};

// @desc    Get waiting queue
// @route   GET /api/routing/queue
// @access  Private (Admin)
const getQueue = async (req, res, next) => {
  try {
    // Sort: Critical first (priority=1), then by timestamp
    const waitingQueue = await Report.find({ inWaitingQueue: true })
      .populate('assignedHandler', 'fullName')
      .sort({ priority: 1, createdAt: 1 });

    const correctionQueue = await Report.find({ inCorrectionQueue: true })
      .sort({ createdAt: 1 });

    const escalated = await Report.find({ isEscalated: true })
      .populate('assignedHandler', 'fullName')
      .sort({ priority: 1, createdAt: 1 });

    res.json({ success: true, waitingQueue, correctionQueue, escalated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get routing decision history
// @route   GET /api/routing/decisions
// @access  Private (Admin)
const getDecisions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [decisions, total] = await Promise.all([
      RoutingDecision.find()
        .populate('reportId', 'reportId establishmentName category')
        .populate('assignedHandler', 'fullName handlerId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      RoutingDecision.countDocuments()
    ]);

    res.json({ success: true, decisions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
};

// @desc    Manual dispatch a report
// @route   POST /api/routing/dispatch
// @access  Private (Admin)
const manualDispatch = async (req, res, next) => {
  try {
    const { reportId } = req.body;

    const report = await Report.findOne({ reportId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.currentStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: `Report is already ${report.currentStatus}` });
    }

    const decision = await dispatchReport(report);
    const updated = await Report.findById(report._id).populate('assignedHandler', 'fullName handlerId zone');

    res.json({ success: true, message: 'Manual dispatch completed', report: updated, decision });
  } catch (error) {
    next(error);
  }
};

// @desc    Update zone configuration
// @route   PUT /api/routing/zones/:id
// @access  Private (Admin)
const updateZone = async (req, res, next) => {
  try {
    const { primaryOfficer, deputyOfficer, maxCapacity, isActive } = req.body;

    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { ...(primaryOfficer !== undefined && { primaryOfficer }), ...(deputyOfficer !== undefined && { deputyOfficer }), ...(maxCapacity !== undefined && { maxCapacity }), ...(isActive !== undefined && { isActive }) },
      { new: true }
    ).populate('primaryOfficer deputyOfficer');

    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    res.json({ success: true, zone });
  } catch (error) {
    next(error);
  }
};

module.exports = { getZones, getRoutingTable, getQueue, getDecisions, manualDispatch, updateZone };

const Report = require('../models/Report');
const StatusHistory = require('../models/StatusHistory');
const { validateIdentifiers } = require('../services/dfaService');
const { classifyViolation } = require('../services/classificationService');
const { generateReportId } = require('../services/reportIdService');
const { dispatchReport } = require('../services/dispatchService');

// Valid status transitions
const VALID_TRANSITIONS = {
  'Pending':     ['Assigned'],
  'Assigned':    ['In Progress'],
  'In Progress': ['Resolved'],
  'Resolved':    []
};

// @desc    Submit a new inspection report
// @route   POST /api/reports
// @access  Private (Inspector, Admin)
const submitReport = async (req, res, next) => {
  try {
    const {
      inspectorName, inspectorId, contactNumber,
      establishmentName, establishmentAddress, pinCode, inspectionDate,
      violationCode, violationDescription, observations, urgencyLevel
    } = req.body;

    // Basic required field check
    const required = { inspectorName, inspectorId, contactNumber, establishmentName, establishmentAddress, pinCode, inspectionDate, violationCode, violationDescription };
    const missing = Object.entries(required).filter(([k, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}` });
    }

    // Store original report snapshot
    const originalReport = { ...req.body };

    // ── DFA + Regex Validation ──
    const validation = validateIdentifiers(inspectorId, violationCode);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + validation.summary,
        validationResult: validation
      });
    }

    // ── Classification ──
    const classification = classifyViolation(validation.extractedCategory, urgencyLevel);

    if (classification.category === 'Unknown') {
      return res.status(400).json({
        success: false,
        message: classification.classificationReason,
        validationResult: validation
      });
    }

    // ── Generate unique Report ID ──
    const reportId = generateReportId();

    // ── Create Report in DB ──
    const report = await Report.create({
      reportId,
      inspectorName,
      inspectorId,
      contactNumber,
      establishmentName,
      establishmentAddress,
      pinCode,
      inspectionDate: new Date(inspectionDate),
      violationCode,
      violationDescription,
      observations,
      urgencyLevel: urgencyLevel || 'medium',
      originalReport,
      validationStatus: 'valid',
      validationMessage: validation.summary,
      dfaValidationResult: {
        inspectorIdValid: validation.inspectorId.dfa.valid,
        violationCodeValid: validation.violationCode.dfa.valid,
        inspectorIdState: validation.inspectorId.dfa.finalState,
        violationCodeState: validation.violationCode.dfa.finalState,
        details: `InspectorID: ${validation.inspectorId.dfa.details} | ViolationCode: ${validation.violationCode.dfa.details}`
      },
      regexValidationResult: {
        inspectorIdValid: validation.inspectorId.regex.valid,
        violationCodeValid: validation.violationCode.regex.valid,
        inspectorIdPattern: validation.inspectorId.regex.pattern,
        violationCodePattern: validation.violationCode.regex.pattern,
        details: `InspectorID: ${validation.inspectorId.regex.details} | ViolationCode: ${validation.violationCode.regex.details}`
      },
      dfaRegexAgreement: validation.dfaRegexAgreement,
      category: classification.category,
      priority: classification.priority,
      priorityLabel: classification.priorityLabel,
      currentStatus: 'Pending',
      submittedBy: req.user._id
    });

    // ── Status History ──
    await StatusHistory.create({
      report: report._id,
      reportId: report.reportId,
      fromStatus: null,
      toStatus: 'Pending',
      changedBy: req.user._id,
      changedByName: req.user.fullName,
      remarks: 'Report submitted'
    });

    // ── Dispatch ──
    let dispatchResult = null;
    try {
      dispatchResult = await dispatchReport(report);
    } catch (dispatchErr) {
      console.error('Dispatch error:', dispatchErr.message);
      // Don't fail the submission if dispatch fails
    }

    // Fetch updated report
    const updatedReport = await Report.findById(report._id).populate('assignedHandler', 'fullName handlerId zone');

    res.status(201).json({
      success: true,
      message: 'Report submitted and dispatched successfully',
      report: updatedReport,
      validation,
      classification,
      dispatch: dispatchResult
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reports with filtering and pagination
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, category, status, zone, pinCode,
      search, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter = {};

    // Role-based filtering
    if (req.user.role === 'handler') {
      const Handler = require('../models/Handler');
      const handler = await Handler.findOne({ userId: req.user._id });
      if (handler) {
        filter.assignedHandler = handler._id;
      } else {
        return res.json({ success: true, reports: [], total: 0, page: 1, pages: 0 });
      }
    }

    if (category) filter.category = category;
    if (status) filter.currentStatus = status;
    if (zone) filter.zone = zone;
    if (pinCode) filter.pinCode = { $regex: pinCode, $options: 'i' };

    if (search) {
      filter.$or = [
        { reportId: { $regex: search, $options: 'i' } },
        { establishmentName: { $regex: search, $options: 'i' } },
        { inspectorId: { $regex: search, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('assignedHandler', 'fullName handlerId zone')
        .populate('submittedBy', 'fullName username')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit)),
      Report.countDocuments(filter)
    ]);

    res.json({
      success: true,
      reports,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report by MongoDB ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('assignedHandler', 'fullName handlerId zone email phone')
      .populate('submittedBy', 'fullName username')
      .populate('routingDecision');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Status history
    const history = await StatusHistory.find({ report: report._id }).sort({ createdAt: 1 });

    res.json({ success: true, report, statusHistory: history });
  } catch (error) {
    next(error);
  }
};

// @desc    Search report by reportId string
// @route   GET /api/reports/search/:reportId
// @access  Private
const searchByReportId = async (req, res, next) => {
  try {
    const report = await Report.findOne({ reportId: req.params.reportId })
      .populate('assignedHandler', 'fullName handlerId zone')
      .populate('routingDecision');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const history = await StatusHistory.find({ report: report._id }).sort({ createdAt: 1 });
    res.json({ success: true, report, statusHistory: history });
  } catch (error) {
    next(error);
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private (Handler, Admin)
const updateStatus = async (req, res, next) => {
  try {
    const { status, resolutionRemarks } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check valid transition
    const allowedNext = VALID_TRANSITIONS[report.currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition: '${report.currentStatus}' → '${status}'. Allowed: ${allowedNext.join(', ') || 'none'}`
      });
    }

    // Role check for handlers
    if (req.user.role === 'handler') {
      const Handler = require('../models/Handler');
      const handler = await Handler.findOne({ userId: req.user._id });
      if (!handler || !report.assignedHandler || report.assignedHandler.toString() !== handler._id.toString()) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this report' });
      }
    }

    const prevStatus = report.currentStatus;

    // Update report
    const updateData = { currentStatus: status };
    if (status === 'Resolved') {
      updateData.resolutionRemarks = resolutionRemarks || 'Resolved';
      updateData.resolvedAt = new Date();

      // Decrement handler open case count
      if (report.assignedHandler) {
        const Handler = require('../models/Handler');
        await Handler.findByIdAndUpdate(report.assignedHandler, {
          $inc: { currentOpenCases: -1 }
        });
      }
    }

    // If transitioning from Pending to Assigned (manual admin action)
    if (status === 'Assigned' && prevStatus === 'Pending') {
      updateData.assignmentTimestamp = new Date();
    }

    await Report.findByIdAndUpdate(report._id, updateData);

    // Log status history
    await StatusHistory.create({
      report: report._id,
      reportId: report.reportId,
      fromStatus: prevStatus,
      toStatus: status,
      changedBy: req.user._id,
      changedByName: req.user.fullName,
      remarks: resolutionRemarks || `Status changed to ${status}`
    });

    const updated = await Report.findById(report._id).populate('assignedHandler', 'fullName handlerId zone');

    res.json({ success: true, message: `Status updated to ${status}`, report: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitReport, getReports, getReportById, searchByReportId, updateStatus };

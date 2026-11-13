const Report = require('../models/Report');
const Handler = require('../models/Handler');
const Zone = require('../models/Zone');

// @desc    Get summary stats
// @route   GET /api/analytics/summary
// @access  Private
const getSummary = async (req, res, next) => {
  try {
    const [
      total, pending, assigned, inProgress, resolved,
      critical, major, minor, advisory, passed,
      waiting, correction, escalated
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ currentStatus: 'Pending' }),
      Report.countDocuments({ currentStatus: 'Assigned' }),
      Report.countDocuments({ currentStatus: 'In Progress' }),
      Report.countDocuments({ currentStatus: 'Resolved' }),
      Report.countDocuments({ category: 'Critical' }),
      Report.countDocuments({ category: 'Major' }),
      Report.countDocuments({ category: 'Minor' }),
      Report.countDocuments({ category: 'Advisory' }),
      Report.countDocuments({ category: 'Passed' }),
      Report.countDocuments({ inWaitingQueue: true }),
      Report.countDocuments({ inCorrectionQueue: true }),
      Report.countDocuments({ isEscalated: true })
    ]);

    res.json({
      success: true,
      summary: {
        total, pending, assigned, inProgress, resolved,
        categories: { critical, major, minor, advisory, passed },
        queues: { waiting, correction, escalated },
        resolved_vs_unresolved: { resolved, unresolved: total - resolved }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Category distribution
// @route   GET /api/analytics/categories
// @access  Private
const getCategoryDistribution = async (req, res, next) => {
  try {
    const data = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const colorMap = {
      'Critical': '#dc2626', 'Major': '#ea580c', 'Minor': '#ca8a04',
      'Advisory': '#2563eb', 'Passed': '#16a34a', 'Unknown': '#6b7280'
    };

    const result = data.map(d => ({
      name: d._id || 'Unknown',
      value: d.count,
      color: colorMap[d._id] || '#6b7280'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Zone distribution
// @route   GET /api/analytics/zones
// @access  Private
const getZoneDistribution = async (req, res, next) => {
  try {
    const data = await Report.aggregate([
      { $group: { _id: '$zone', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const result = data.map(d => ({
      name: d._id || 'Unknown',
      value: d.count
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Status distribution
// @route   GET /api/analytics/status
// @access  Private
const getStatusDistribution = async (req, res, next) => {
  try {
    const data = await Report.aggregate([
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const colorMap = {
      'Pending': '#6b7280', 'Assigned': '#2563eb',
      'In Progress': '#ea580c', 'Resolved': '#16a34a'
    };

    const result = data.map(d => ({
      name: d._id,
      value: d.count,
      color: colorMap[d._id] || '#6b7280'
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Handler workload
// @route   GET /api/analytics/handlers
// @access  Private (Admin)
const getHandlerWorkload = async (req, res, next) => {
  try {
    const handlers = await Handler.find().select('fullName handlerId zone currentOpenCases maxCapacity isAvailable');

    const workloadData = handlers.map(h => ({
      name: h.fullName,
      handlerId: h.handlerId,
      zone: h.zone,
      openCases: h.currentOpenCases,
      maxCapacity: h.maxCapacity,
      utilization: Math.round((h.currentOpenCases / h.maxCapacity) * 100),
      isAvailable: h.isAvailable
    }));

    // Priority distribution
    const priorityData = await Report.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 }, label: { $first: '$priorityLabel' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      handlerWorkload: workloadData,
      priorityDistribution: priorityData.map(d => ({
        name: d.label || `P${d._id}`,
        value: d.count,
        priority: d._id
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getCategoryDistribution, getZoneDistribution, getStatusDistribution, getHandlerWorkload };

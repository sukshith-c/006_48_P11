const Handler = require('../models/Handler');
const Report = require('../models/Report');

// @desc    Get all handlers
// @route   GET /api/handlers
// @access  Private (Admin)
const getHandlers = async (req, res, next) => {
  try {
    const handlers = await Handler.find()
      .populate('userId', 'fullName email username')
      .populate('zoneId', 'zoneName');
    res.json({ success: true, handlers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get handler by ID
// @route   GET /api/handlers/:id
// @access  Private
const getHandlerById = async (req, res, next) => {
  try {
    const handler = await Handler.findById(req.params.id)
      .populate('userId', 'fullName email')
      .populate('zoneId', 'zoneName');

    if (!handler) {
      return res.status(404).json({ success: false, message: 'Handler not found' });
    }

    // Get assigned open reports
    const openReports = await Report.find({
      assignedHandler: handler._id,
      currentStatus: { $in: ['Assigned', 'In Progress'] }
    }).select('reportId establishmentName category priority currentStatus createdAt');

    res.json({ success: true, handler, openReports });
  } catch (error) {
    next(error);
  }
};

// @desc    Update handler availability
// @route   PUT /api/handlers/:id/availability
// @access  Private (Handler self, Admin)
const updateAvailability = async (req, res, next) => {
  try {
    const { isAvailable } = req.body;

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isAvailable must be a boolean' });
    }

    const handler = await Handler.findByIdAndUpdate(
      req.params.id,
      { isAvailable },
      { new: true }
    );

    if (!handler) {
      return res.status(404).json({ success: false, message: 'Handler not found' });
    }

    res.json({ success: true, message: `Handler availability set to ${isAvailable}`, handler });
  } catch (error) {
    next(error);
  }
};

// @desc    Update handler capacity
// @route   PUT /api/handlers/:id/capacity
// @access  Private (Admin)
const updateCapacity = async (req, res, next) => {
  try {
    const { maxCapacity } = req.body;

    if (typeof maxCapacity !== 'number' || maxCapacity < 1) {
      return res.status(400).json({ success: false, message: 'maxCapacity must be a positive number' });
    }

    const handler = await Handler.findByIdAndUpdate(
      req.params.id,
      { maxCapacity },
      { new: true }
    );

    if (!handler) {
      return res.status(404).json({ success: false, message: 'Handler not found' });
    }

    res.json({ success: true, message: `Handler max capacity updated to ${maxCapacity}`, handler });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHandlers, getHandlerById, updateAvailability, updateCapacity };

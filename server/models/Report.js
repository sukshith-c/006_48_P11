const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Unique identifier
  reportId: { type: String, required: true, unique: true, index: true },

  // Inspector Information
  inspectorName: { type: String, required: true },
  inspectorId: { type: String, required: true, index: true },
  contactNumber: { type: String, required: true },

  // Establishment Information
  establishmentName: { type: String, required: true },
  establishmentAddress: { type: String, required: true },
  pinCode: { type: String, required: true, index: true },
  inspectionDate: { type: Date, required: true },

  // Violation Information
  violationCode: { type: String, required: true },
  violationDescription: { type: String, required: true },
  observations: { type: String },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },

  // Stored original report snapshot
  originalReport: { type: mongoose.Schema.Types.Mixed },

  // DFA & Regex Validation Results
  validationStatus: { type: String, enum: ['valid', 'invalid', 'pending'], default: 'pending' },
  validationMessage: { type: String },
  dfaValidationResult: {
    inspectorIdValid: { type: Boolean },
    violationCodeValid: { type: Boolean },
    inspectorIdState: { type: String },
    violationCodeState: { type: String },
    details: { type: String }
  },
  regexValidationResult: {
    inspectorIdValid: { type: Boolean },
    violationCodeValid: { type: Boolean },
    inspectorIdPattern: { type: String },
    violationCodePattern: { type: String },
    details: { type: String }
  },
  dfaRegexAgreement: { type: Boolean },

  // Classification
  category: {
    type: String,
    enum: ['Critical', 'Major', 'Minor', 'Advisory', 'Passed', 'Unknown'],
    default: 'Unknown',
    index: true
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  priorityLabel: { type: String },

  // Routing & Assignment
  zone: { type: String, index: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: 'Handler', index: true },
  assignedHandlerName: { type: String },
  routingDecision: { type: mongoose.Schema.Types.ObjectId, ref: 'RoutingDecision' },
  assignmentType: {
    type: String,
    enum: ['primary', 'deputy', 'escalation', 'waiting_queue', 'correction_queue', 'none'],
    default: 'none'
  },
  escalationReason: { type: String },

  // Status
  currentStatus: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
    default: 'Pending',
    index: true
  },
  resolutionRemarks: { type: String },
  resolvedAt: { type: Date },

  // Submission metadata
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignmentTimestamp: { type: Date },
  isEscalated: { type: Boolean, default: false },
  inWaitingQueue: { type: Boolean, default: false },
  inCorrectionQueue: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Compound indexes for common queries
reportSchema.index({ category: 1, currentStatus: 1 });
reportSchema.index({ pinCode: 1, currentStatus: 1 });
reportSchema.index({ assignedHandler: 1, currentStatus: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);

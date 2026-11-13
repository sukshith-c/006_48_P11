const mongoose = require('mongoose');

const routingDecisionSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  reportIdStr: { type: String, required: true },
  pinCode: { type: String, required: true },
  zone: { type: String },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  category: { type: String },
  priority: { type: Number },
  assignedHandler: { type: mongoose.Schema.Types.ObjectId, ref: 'Handler' },
  assignedHandlerName: { type: String },
  assignmentType: {
    type: String,
    enum: ['primary', 'deputy', 'escalation', 'waiting_queue', 'correction_queue'],
    required: true
  },
  decisionReason: { type: String },
  escalationReason: { type: String },
  primaryChecked: { type: Boolean, default: false },
  primaryAvailable: { type: Boolean },
  primaryAtCapacity: { type: Boolean },
  deputyChecked: { type: Boolean, default: false },
  deputyAvailable: { type: Boolean },
  deputyAtCapacity: { type: Boolean },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RoutingDecision', routingDecisionSchema);

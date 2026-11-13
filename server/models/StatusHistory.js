const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  reportId: { type: String, required: true },
  fromStatus: { type: String },
  toStatus: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedByName: { type: String },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StatusHistory', statusHistorySchema);

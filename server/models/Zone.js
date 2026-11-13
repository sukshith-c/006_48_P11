const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true, unique: true },
  zoneName: { type: String, required: true },
  pinCodeRangeStart: { type: String, required: true },
  pinCodeRangeEnd: { type: String, required: true },
  pinCodePrefix: { type: String, required: true }, // e.g., "56", "57"
  primaryOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Handler' },
  deputyOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'Handler' },
  currentOpenCases: { type: Number, default: 0 },
  maxCapacity: { type: Number, default: 20 },
  isActive: { type: Boolean, default: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Zone', zoneSchema);

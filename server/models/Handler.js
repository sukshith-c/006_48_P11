const mongoose = require('mongoose');

const handlerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  handlerId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  zone: { type: String, required: true },
  zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
  role: { type: String, enum: ['primary', 'deputy', 'central'], default: 'primary' },
  isAvailable: { type: Boolean, default: true },
  maxCapacity: { type: Number, default: 10 },
  currentOpenCases: { type: Number, default: 0 },
  specialization: { type: String, default: 'General' },
  assignedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }]
}, { timestamps: true });

handlerSchema.virtual('isAtCapacity').get(function() {
  return this.currentOpenCases >= this.maxCapacity;
});

handlerSchema.virtual('canAcceptCase').get(function() {
  return this.isAvailable && this.currentOpenCases < this.maxCapacity;
});

handlerSchema.set('toObject', { virtuals: true });
handlerSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Handler', handlerSchema);

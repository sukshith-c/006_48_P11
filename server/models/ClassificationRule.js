const mongoose = require('mongoose');

const classificationRuleSchema = new mongoose.Schema({
  categoryCode: { type: String, required: true, unique: true },
  categoryName: { type: String, required: true },
  priority: { type: Number, required: true },
  color: { type: String },
  description: { type: String },
  emergencyOverride: { type: Boolean, default: false },
  violationCodePattern: { type: String } // regex pattern for matching
}, { timestamps: true });

module.exports = mongoose.model('ClassificationRule', classificationRuleSchema);

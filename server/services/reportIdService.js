/**
 * Report ID Generation Service
 * Format: FSP-YYYYMMDD-NNNNNN
 */
const crypto = require('crypto');

function generateReportId() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `FSP-${dateStr}-${random}`;
}

module.exports = { generateReportId };

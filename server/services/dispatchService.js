/**
 * Dispatch Service - Computer Networks Integration (BCS502)
 * 
 * 6-Zone routing table with:
 * - Primary officer assignment
 * - Deputy fallback
 * - Emergency escalation for Critical
 * - Waiting queue for capacity overflow
 * - Correction queue for unknown zones
 * - Atomic assignment to prevent duplicates
 */

const mongoose = require('mongoose');
const Handler = require('../models/Handler');
const Zone = require('../models/Zone');
const Report = require('../models/Report');
const RoutingDecision = require('../models/RoutingDecision');

// PIN code prefix → Zone mapping (6 zones)
// Using standard Indian PIN code prefixes
const ZONE_PIN_MAPPING = {
  '56': 'Zone-1',  // 560001-569999
  '57': 'Zone-2',  // 570001-579999
  '58': 'Zone-3',  // 580001-589999
  '59': 'Zone-4',  // 590001-599999
  '60': 'Zone-5',  // 600001-609999
  '61': 'Zone-6',  // 610001-619999
};

function getZoneFromPinCode(pinCode) {
  if (!pinCode || typeof pinCode !== 'string') {
    return null;
  }
  const cleanPin = pinCode.trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanPin)) {
    return null;
  }
  const prefix = cleanPin.substring(0, 2);
  return ZONE_PIN_MAPPING[prefix] || null;
}

function getPinCodePrefix(pinCode) {
  if (!pinCode) return null;
  return pinCode.trim().substring(0, 2);
}

/**
 * Main dispatch function with atomic assignment.
 * Uses MongoDB session for transaction-safe assignment.
 */
async function dispatchReport(report) {
  const session = await mongoose.startSession();
  
  let decision = null;
  
  try {
    await session.withTransaction(async () => {
      const pinCode = report.pinCode;
      const zoneName = getZoneFromPinCode(pinCode);
      const isCritical = report.category === 'Critical';

      // ── STEP 1: Unknown zone → correction queue ──
      if (!zoneName) {
        const decisionDoc = await RoutingDecision.create([{
          reportId: report._id,
          reportIdStr: report.reportId,
          pinCode,
          zone: 'Unknown',
          category: report.category,
          priority: report.priority,
          assignmentType: 'correction_queue',
          decisionReason: `PIN code '${pinCode}' does not map to any configured zone. Sent to central correction queue.`,
          primaryChecked: false,
          deputyChecked: false
        }], { session });

        await Report.findByIdAndUpdate(report._id, {
          zone: 'Unknown',
          currentStatus: 'Pending',
          assignmentType: 'correction_queue',
          inCorrectionQueue: true,
          routingDecision: decisionDoc[0]._id,
          escalationReason: `Unknown PIN code zone: ${pinCode}`
        }, { session });

        decision = decisionDoc[0];
        return;
      }

      // ── STEP 2: Look up zone record ──
      const zone = await Zone.findOne({ zoneId: zoneName }).populate('primaryOfficer deputyOfficer').session(session);

      if (!zone) {
        // Zone not configured in DB → correction queue
        const decisionDoc = await RoutingDecision.create([{
          reportId: report._id,
          reportIdStr: report.reportId,
          pinCode,
          zone: zoneName,
          category: report.category,
          priority: report.priority,
          assignmentType: 'correction_queue',
          decisionReason: `Zone '${zoneName}' found from PIN but not configured in DB. Sent to correction queue.`
        }], { session });

        await Report.findByIdAndUpdate(report._id, {
          zone: zoneName,
          currentStatus: 'Pending',
          assignmentType: 'correction_queue',
          inCorrectionQueue: true,
          routingDecision: decisionDoc[0]._id
        }, { session });

        decision = decisionDoc[0];
        return;
      }

      const decisionData = {
        reportId: report._id,
        reportIdStr: report.reportId,
        pinCode,
        zone: zoneName,
        zoneId: zone._id,
        category: report.category,
        priority: report.priority,
        primaryChecked: false,
        deputyChecked: false
      };

      // ── STEP 3: Critical emergency override ──
      if (isCritical) {
        decisionData.escalationReason = 'CRITICAL priority: emergency escalation triggered';
        // Try primary first, then deputy, then escalation queue
      }

      // ── STEP 4: Check primary officer ──
      let assignedHandler = null;
      let assignmentType = null;

      if (zone.primaryOfficer) {
        const primary = await Handler.findById(zone.primaryOfficer._id).session(session);
        decisionData.primaryChecked = true;
        decisionData.primaryAvailable = primary?.isAvailable;
        decisionData.primaryAtCapacity = primary ? primary.currentOpenCases >= primary.maxCapacity : true;

        if (primary && primary.isAvailable && primary.currentOpenCases < primary.maxCapacity) {
          assignedHandler = primary;
          assignmentType = isCritical ? 'escalation' : 'primary';
        }
      }

      // ── STEP 5: Fallback to deputy ──
      if (!assignedHandler && zone.deputyOfficer) {
        const deputy = await Handler.findById(zone.deputyOfficer._id).session(session);
        decisionData.deputyChecked = true;
        decisionData.deputyAvailable = deputy?.isAvailable;
        decisionData.deputyAtCapacity = deputy ? deputy.currentOpenCases >= deputy.maxCapacity : true;

        if (deputy && deputy.isAvailable && deputy.currentOpenCases < deputy.maxCapacity) {
          assignedHandler = deputy;
          assignmentType = isCritical ? 'escalation' : 'deputy';
        }
      }

      // ── STEP 6: Waiting queue if no handler available ──
      if (!assignedHandler) {
        assignmentType = 'waiting_queue';
        decisionData.assignmentType = 'waiting_queue';
        decisionData.decisionReason = isCritical
          ? `CRITICAL report: all officers at capacity or unavailable. Placed in waiting queue with highest priority.`
          : `No available officers in ${zoneName}. Report placed in waiting queue.`;

        const decisionDoc = await RoutingDecision.create([decisionData], { session });

        await Report.findByIdAndUpdate(report._id, {
          zone: zoneName,
          zoneId: zone._id,
          currentStatus: 'Pending',
          assignmentType: 'waiting_queue',
          inWaitingQueue: true,
          isEscalated: isCritical,
          routingDecision: decisionDoc[0]._id,
          escalationReason: isCritical ? 'Critical report in waiting queue - emergency' : undefined
        }, { session });

        decision = decisionDoc[0];
        return;
      }

      // ── STEP 7: Assign to handler (atomic increment) ──
      await Handler.findByIdAndUpdate(assignedHandler._id, {
        $inc: { currentOpenCases: 1 },
        $push: { assignedReports: report._id }
      }, { session });

      decisionData.assignedHandler = assignedHandler._id;
      decisionData.assignedHandlerName = assignedHandler.fullName;
      decisionData.assignmentType = assignmentType;
      decisionData.decisionReason = isCritical
        ? `CRITICAL priority override: Assigned to ${assignmentType} officer ${assignedHandler.fullName}`
        : `Assigned to ${assignmentType} officer ${assignedHandler.fullName} in ${zoneName}`;

      const decisionDoc = await RoutingDecision.create([decisionData], { session });

      await Report.findByIdAndUpdate(report._id, {
        zone: zoneName,
        zoneId: zone._id,
        assignedHandler: assignedHandler._id,
        assignedHandlerName: assignedHandler.fullName,
        currentStatus: 'Assigned',
        assignmentType,
        isEscalated: isCritical,
        routingDecision: decisionDoc[0]._id,
        assignmentTimestamp: new Date()
      }, { session });

      decision = decisionDoc[0];
    });

    return decision;
  } finally {
    session.endSession();
  }
}

module.exports = {
  dispatchReport,
  getZoneFromPinCode,
  getPinCodePrefix,
  ZONE_PIN_MAPPING
};

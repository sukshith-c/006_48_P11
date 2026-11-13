/**
 * Classification Service
 * Maps violation categories to priority levels (1=highest, 5=lowest)
 * Implements deterministic priority rules for conflicting patterns
 */

const CATEGORY_MAP = {
  'CRITICAL':  { name: 'Critical',  priority: 1, label: 'P1-Critical',  color: '#dc2626', emergencyOverride: true  },
  'MAJOR':     { name: 'Major',     priority: 2, label: 'P2-Major',     color: '#ea580c', emergencyOverride: false },
  'MINOR':     { name: 'Minor',     priority: 3, label: 'P3-Minor',     color: '#ca8a04', emergencyOverride: false },
  'ADVISORY':  { name: 'Advisory',  priority: 4, label: 'P4-Advisory',  color: '#2563eb', emergencyOverride: false },
  'PASSED':    { name: 'Passed',    priority: 5, label: 'P5-Passed',    color: '#16a34a', emergencyOverride: false },
};

/**
 * Deterministic classification from a validated violation code category.
 * Priority rule: CRITICAL > MAJOR > MINOR > ADVISORY > PASSED
 * Never silently assigns unknown codes to valid categories.
 */
function classifyViolation(categoryCode, urgencyLevel = 'medium') {
  if (!categoryCode) {
    return {
      category: 'Unknown',
      priority: 99,
      priorityLabel: 'Unknown',
      color: '#6b7280',
      emergencyOverride: false,
      classificationReason: 'No category code provided'
    };
  }

  const upper = categoryCode.toUpperCase();
  const rule = CATEGORY_MAP[upper];

  if (!rule) {
    return {
      category: 'Unknown',
      priority: 99,
      priorityLabel: 'Unknown',
      color: '#6b7280',
      emergencyOverride: false,
      classificationReason: `Unknown category code: '${categoryCode}'. Supported: ${Object.keys(CATEGORY_MAP).join(', ')}`
    };
  }

  // Priority override: if urgencyLevel is 'critical', escalate priority
  let effectivePriority = rule.priority;
  let priorityLabel = rule.label;
  let escalated = false;

  if (urgencyLevel === 'critical' && rule.priority > 1) {
    effectivePriority = Math.max(1, rule.priority - 1);
    priorityLabel = `${rule.label} (Urgency Escalated)`;
    escalated = true;
  }

  return {
    category: rule.name,
    priority: effectivePriority,
    priorityLabel,
    color: rule.color,
    emergencyOverride: rule.emergencyOverride || (upper === 'CRITICAL'),
    escalated,
    classificationReason: escalated
      ? `Category '${rule.name}' (priority ${rule.priority}) escalated to priority ${effectivePriority} due to critical urgency level`
      : `Category '${rule.name}' assigned priority ${rule.priority} per classification rules`
  };
}

/**
 * Handle conflicting classification patterns.
 * If multiple patterns match, apply deterministic priority rule: take highest severity.
 */
function resolveConflictingClassification(categories) {
  if (!categories || categories.length === 0) {
    return classifyViolation(null);
  }

  if (categories.length === 1) {
    return classifyViolation(categories[0]);
  }

  // Sort by priority (ascending = most critical first)
  const sorted = categories
    .map(c => ({ code: c, ...CATEGORY_MAP[c.toUpperCase()] }))
    .filter(c => c.priority !== undefined)
    .sort((a, b) => a.priority - b.priority);

  if (sorted.length === 0) {
    return classifyViolation(null);
  }

  const winner = sorted[0];
  return {
    ...classifyViolation(winner.code),
    classificationReason: `Conflicting patterns resolved: ${categories.join(', ')}. Deterministic rule applied: selected highest severity '${winner.name}' (priority ${winner.priority})`
  };
}

function getAllCategories() {
  return Object.entries(CATEGORY_MAP).map(([code, info]) => ({
    code,
    ...info
  }));
}

module.exports = {
  classifyViolation,
  resolveConflictingClassification,
  getAllCategories,
  CATEGORY_MAP
};

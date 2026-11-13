import React from 'react';

const CATEGORY_CONFIG = {
  'Critical':  { cls: 'badge-critical',   dot: '🔴' },
  'Major':     { cls: 'badge-major',      dot: '🟠' },
  'Minor':     { cls: 'badge-minor',      dot: '🟡' },
  'Advisory':  { cls: 'badge-advisory',   dot: '🔵' },
  'Passed':    { cls: 'badge-passed',     dot: '🟢' },
  'Unknown':   { cls: 'badge-unknown',    dot: '⚪' }
};

const STATUS_CONFIG = {
  'Pending':     { cls: 'badge-pending' },
  'Assigned':    { cls: 'badge-assigned' },
  'In Progress': { cls: 'badge-inprogress' },
  'Resolved':    { cls: 'badge-resolved' }
};

const ASSIGNMENT_CONFIG = {
  'primary':          { cls: 'badge-primary-assign', label: 'Primary' },
  'deputy':           { cls: 'badge-deputy-assign',  label: 'Deputy' },
  'escalation':       { cls: 'badge-escalated',      label: 'Escalated' },
  'waiting_queue':    { cls: 'badge-waiting',         label: 'Waiting Queue' },
  'correction_queue': { cls: 'badge-correction',      label: 'Correction Queue' },
  'none':             { cls: 'badge-unknown',          label: 'None' }
};

export const CategoryBadge = ({ category }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Unknown'];
  return <span className={`badge ${config.cls}`}>{config.dot} {category}</span>;
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || { cls: 'badge-unknown' };
  return <span className={`badge ${config.cls}`}>{status}</span>;
};

export const AssignmentBadge = ({ type }) => {
  const config = ASSIGNMENT_CONFIG[type] || ASSIGNMENT_CONFIG['none'];
  return <span className={`badge ${config.cls}`}>{config.label}</span>;
};

export const PriorityBadge = ({ priority, label }) => {
  const cls = `priority-p${priority}`;
  return <span className={cls}>{label || `P${priority}`}</span>;
};

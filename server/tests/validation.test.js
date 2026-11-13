/**
 * Food Safety Portal - Automated Test Suite
 * TC-001 through TC-022 (22 test cases)
 * Jest + Supertest
 */

const {
  simulateInspectorIdDFA,
  simulateViolationCodeDFA,
  validateInspectorIdRegex,
  validateViolationCodeRegex,
  validateIdentifiers,
  VALID_CATEGORIES
} = require('../services/dfaService');

const {
  classifyViolation,
  resolveConflictingClassification
} = require('../services/classificationService');

const {
  getZoneFromPinCode,
  ZONE_PIN_MAPPING
} = require('../services/dispatchService');

// ════════════════════════════════════════════
// GROUP 1: Inspector ID Validation
// ════════════════════════════════════════════
describe('TC-001 to TC-003: Inspector ID DFA Validation', () => {

  test('TC-001: Valid Inspector ID INSAB1234 accepted by DFA', () => {
    const result = simulateInspectorIdDFA('INSAB1234');
    expect(result.valid).toBe(true);
    expect(result.finalState).toBe('q9');
  });

  test('TC-002: Invalid Inspector ID INS123 (too short) rejected by DFA', () => {
    const result = simulateInspectorIdDFA('INS123');
    expect(result.valid).toBe(false);
  });

  test('TC-003: Invalid Inspector ID INSABC1234 (3 letters) rejected by DFA', () => {
    const result = simulateInspectorIdDFA('INSABC1234');
    expect(result.valid).toBe(false);
  });
});

// ════════════════════════════════════════════
// GROUP 2: Violation Code Validation
// ════════════════════════════════════════════
describe('TC-004 to TC-006: Violation Code DFA Validation', () => {

  test('TC-004: Valid Violation Code V01-CRITICAL accepted by DFA', () => {
    const result = simulateViolationCodeDFA('V01-CRITICAL');
    expect(result.valid).toBe(true);
    expect(result.extractedCategory).toBe('CRITICAL');
  });

  test('TC-005: Invalid Violation Code V1-CRITICAL (single digit) rejected', () => {
    const result = simulateViolationCodeDFA('V1-CRITICAL');
    expect(result.valid).toBe(false);
  });

  test('TC-006: Violation Code with unknown category V01-UNKNOWN rejected', () => {
    const result = simulateViolationCodeDFA('V01-UNKNOWN');
    expect(result.valid).toBe(false);
    expect(result.extractedCategory).toBe('UNKNOWN');
  });
});

// ════════════════════════════════════════════
// GROUP 3: DFA and Regex Agreement
// ════════════════════════════════════════════
describe('TC-007 to TC-008: DFA and Regex Agreement', () => {

  test('TC-007: DFA and Regex agree on valid identifiers INSXY9876 / V05-MAJOR', () => {
    const result = validateIdentifiers('INSXY9876', 'V05-MAJOR');
    expect(result.isValid).toBe(true);
    expect(result.dfaRegexAgreement).toBe(true);
    expect(result.inspectorId.dfa.valid).toBe(result.inspectorId.regex.valid);
    expect(result.violationCode.dfa.valid).toBe(result.violationCode.regex.valid);
  });

  test('TC-008: DFA and Regex agree on invalid Inspector ID', () => {
    const result = validateIdentifiers('BADINSPECTOR', 'V01-CRITICAL');
    expect(result.isValid).toBe(false);
    expect(result.inspectorId.dfa.valid).toBe(false);
    expect(result.inspectorId.regex.valid).toBe(false);
    expect(result.inspectorId.agreement).toBe(true);
  });
});

// ════════════════════════════════════════════
// GROUP 4: Five-Category Classification
// ════════════════════════════════════════════
describe('TC-009 to TC-013: Five-Category Classification', () => {

  test('TC-009: CRITICAL violation → category=Critical, priority=1', () => {
    const r = classifyViolation('CRITICAL');
    expect(r.category).toBe('Critical');
    expect(r.priority).toBe(1);
    expect(r.emergencyOverride).toBe(true);
  });

  test('TC-010: MAJOR violation → category=Major, priority=2', () => {
    const r = classifyViolation('MAJOR');
    expect(r.category).toBe('Major');
    expect(r.priority).toBe(2);
  });

  test('TC-011: MINOR violation → category=Minor, priority=3', () => {
    const r = classifyViolation('MINOR');
    expect(r.category).toBe('Minor');
    expect(r.priority).toBe(3);
  });

  test('TC-012: ADVISORY violation → category=Advisory, priority=4', () => {
    const r = classifyViolation('ADVISORY');
    expect(r.category).toBe('Advisory');
    expect(r.priority).toBe(4);
  });

  test('TC-013: PASSED violation → category=Passed, priority=5', () => {
    const r = classifyViolation('PASSED');
    expect(r.category).toBe('Passed');
    expect(r.priority).toBe(5);
  });
});

// ════════════════════════════════════════════
// GROUP 5: Edge Cases in Classification
// ════════════════════════════════════════════
describe('TC-014 to TC-015: Classification Edge Cases', () => {

  test('TC-014: Unknown category code → Unknown (not silently assigned)', () => {
    const r = classifyViolation('ILLEGAL_CODE');
    expect(r.category).toBe('Unknown');
    expect(r.priority).toBe(99);
  });

  test('TC-015: Conflicting patterns → deterministic: Critical wins', () => {
    const r = resolveConflictingClassification(['MAJOR', 'CRITICAL', 'ADVISORY']);
    expect(r.category).toBe('Critical');
    expect(r.priority).toBe(1);
  });
});

// ════════════════════════════════════════════
// GROUP 6: Zone Routing
// ════════════════════════════════════════════
describe('TC-016 to TC-019: Zone Routing', () => {

  test('TC-016: PIN code 560001 → Zone-1', () => {
    const zone = getZoneFromPinCode('560001');
    expect(zone).toBe('Zone-1');
  });

  test('TC-017: PIN code 600001 → Zone-5 (Chennai)', () => {
    const zone = getZoneFromPinCode('600001');
    expect(zone).toBe('Zone-5');
  });

  test('TC-018: Unknown PIN code 999999 → null (correction queue)', () => {
    const zone = getZoneFromPinCode('999999');
    expect(zone).toBeNull();
  });

  test('TC-019: Malformed PIN code ABCDEF → null (invalid format)', () => {
    const zone = getZoneFromPinCode('ABCDEF');
    expect(zone).toBeNull();
  });
});

// ════════════════════════════════════════════
// GROUP 7: Regex Validation
// ════════════════════════════════════════════
describe('TC-020 to TC-021: Regex Validation', () => {

  test('TC-020: Regex validates INSQZ0001 as valid Inspector ID', () => {
    const r = validateInspectorIdRegex('INSQZ0001');
    expect(r.valid).toBe(true);
  });

  test('TC-021: Regex validates V99-ADVISORY as valid Violation Code', () => {
    const r = validateViolationCodeRegex('V99-ADVISORY');
    expect(r.valid).toBe(true);
    expect(r.extractedCategory).toBe('ADVISORY');
  });
});

// ════════════════════════════════════════════
// GROUP 8: Priority Override and Edge Cases
// ════════════════════════════════════════════
describe('TC-022: Priority Override', () => {

  test('TC-022: Critical urgency escalates MAJOR from priority 2 to 1', () => {
    const r = classifyViolation('MAJOR', 'critical');
    expect(r.escalated).toBe(true);
    expect(r.priority).toBeLessThan(2);
  });
});

// ════════════════════════════════════════════
// BONUS: Input format edge cases
// ════════════════════════════════════════════
describe('Additional Input Validation Edge Cases', () => {

  test('Inspector ID with lowercase input accepted (case-insensitive DFA)', () => {
    const r = simulateInspectorIdDFA('insab1234');
    expect(r.valid).toBe(true);
  });

  test('Violation Code with lowercase input accepted (case-insensitive DFA)', () => {
    const r = simulateViolationCodeDFA('v01-critical');
    expect(r.valid).toBe(true);
    expect(r.extractedCategory).toBe('CRITICAL');
  });

  test('Empty Inspector ID rejected', () => {
    const r = simulateInspectorIdDFA('');
    expect(r.valid).toBe(false);
  });

  test('All 6 zones properly mapped', () => {
    const prefixes = Object.keys(ZONE_PIN_MAPPING);
    expect(prefixes.length).toBe(6);
  });

  test('All 5 valid categories present', () => {
    expect(VALID_CATEGORIES).toContain('CRITICAL');
    expect(VALID_CATEGORIES).toContain('MAJOR');
    expect(VALID_CATEGORIES).toContain('MINOR');
    expect(VALID_CATEGORIES).toContain('ADVISORY');
    expect(VALID_CATEGORIES).toContain('PASSED');
    expect(VALID_CATEGORIES.length).toBe(5);
  });
});

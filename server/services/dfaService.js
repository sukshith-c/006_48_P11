/**
 * DFA Service - Automata Theory Integration (BCS503)
 * 
 * Implements DFA-based validation for:
 * 1. Inspector ID: INS[2 uppercase letters][4 digits]  e.g. INSAB1234
 * 2. Violation Code: V[2 digits]-[CATEGORY]            e.g. V01-CRITICAL
 * 
 * Valid categories: CRITICAL, MAJOR, MINOR, ADVISORY, PASSED
 */

// ─────────────────────────────────────────────────────────────
// INSPECTOR ID DFA
// Language: INS[A-Z][A-Z][0-9][0-9][0-9][0-9]
// States: q0..q9, q_reject
// ─────────────────────────────────────────────────────────────

const INSPECTOR_DFA = {
  states: ['q0','q1','q2','q3','q4','q5','q6','q7','q8','q9','q_reject'],
  alphabet: ['I','N','S','A-Z','0-9'],
  initialState: 'q0',
  acceptStates: ['q8'],
  transitions: {
    q0: { 'I': 'q1', '_': 'q_reject' },
    q1: { 'N': 'q2', '_': 'q_reject' },
    q2: { 'S': 'q3', '_': 'q_reject' },
    q3: { 'A-Z': 'q4', '_': 'q_reject' },
    q4: { 'A-Z': 'q5', '_': 'q_reject' },
    q5: { '0-9': 'q6', '_': 'q_reject' },
    q6: { '0-9': 'q7', '_': 'q_reject' },
    q7: { '0-9': 'q8', '_': 'q_reject' },
    q8: { '0-9': 'q9', '_': 'q_reject' },  // q9 = accept (after 4th digit)
    q9: { '_': 'q_reject' },
    q_reject: { '_': 'q_reject' }
  }
};

// ─────────────────────────────────────────────────────────────
// VIOLATION CODE DFA
// Language: V[0-9][0-9]-CRITICAL|MAJOR|MINOR|ADVISORY|PASSED
// ─────────────────────────────────────────────────────────────

const VIOLATION_DFA = {
  states: ['v0','v1','v2','v3','v4','v_accept','v_reject'],
  alphabet: ['V','0-9','-','CATEGORY'],
  initialState: 'v0',
  acceptStates: ['v_accept'],
  transitions: {
    v0: { 'V': 'v1', '_': 'v_reject' },
    v1: { '0-9': 'v2', '_': 'v_reject' },
    v2: { '0-9': 'v3', '_': 'v_reject' },
    v3: { '-': 'v4', '_': 'v_reject' },
    v4: { 'CATEGORY': 'v_accept', '_': 'v_reject' },
    v_accept: { '_': 'v_reject' },
    v_reject: { '_': 'v_reject' }
  }
};

const VALID_CATEGORIES = ['CRITICAL', 'MAJOR', 'MINOR', 'ADVISORY', 'PASSED'];

// ─────────────────────────────────────────────────────────────
// DFA simulation for Inspector ID
// ─────────────────────────────────────────────────────────────
function simulateInspectorIdDFA(input) {
  if (typeof input !== 'string') {
    return { valid: false, finalState: 'q_reject', details: 'Input must be a string' };
  }

  const chars = input.toUpperCase().split('');
  let state = 'q0';
  const trace = [];

  const getCharClass = (char, stateIndex) => {
    if (stateIndex === 0) return char === 'I' ? 'I' : '_';
    if (stateIndex === 1) return char === 'N' ? 'N' : '_';
    if (stateIndex === 2) return char === 'S' ? 'S' : '_';
    if (stateIndex === 3 || stateIndex === 4) return /^[A-Z]$/.test(char) ? 'A-Z' : '_';
    if (stateIndex >= 5 && stateIndex <= 8) return /^[0-9]$/.test(char) ? '0-9' : '_';
    return '_';
  };

  for (let i = 0; i < chars.length; i++) {
    const charClass = getCharClass(chars[i], i);
    const transition = INSPECTOR_DFA.transitions[state];
    const nextState = transition[charClass] || transition['_'] || 'q_reject';
    trace.push({ char: chars[i], charClass, fromState: state, toState: nextState });
    state = nextState;
    if (state === 'q_reject') break;
  }

  // Inspector ID must be exactly 9 characters: INS + 2 letters + 4 digits
  // After processing all chars, we must be in state q9 (which corresponds to q8 reading 4th digit)
  // Let's re-map: q0->q1->q2->q3->q4->q5->q6->q7->q8->q9 means 9 chars consumed
  // Accept if state == q9 and input length == 9
  const isAccepted = chars.length === 9 && state === 'q9';
  
  // But wait, in our DFA q8 is after 3rd digit, q9 is after 4th digit = accept
  // Let's verify: q0(I)->q1(N)->q2(S)->q3(L1)->q4(L2)->q5(D1)->q6(D2)->q7(D3)->q8(D4)->q9
  // So q9 is the actual accept state

  return {
    valid: isAccepted,
    finalState: state,
    acceptStates: ['q9'],
    trace,
    details: isAccepted
      ? `DFA accepted: traversed ${trace.length} transitions, reached accept state ${state}`
      : `DFA rejected: stopped at state ${state} after ${trace.length} chars. Expected: q9 (9-char string INS+2letters+4digits)`
  };
}

// ─────────────────────────────────────────────────────────────
// DFA simulation for Violation Code
// ─────────────────────────────────────────────────────────────
function simulateViolationCodeDFA(input) {
  if (typeof input !== 'string') {
    return { valid: false, finalState: 'v_reject', details: 'Input must be a string' };
  }

  const upper = input.toUpperCase();

  // Parse: must start with V, then 2 digits, then -, then category
  if (upper.length < 5) {
    return {
      valid: false,
      finalState: 'v_reject',
      details: `DFA rejected: input too short (${upper.length} chars). Minimum: V + 2 digits + - + category`
    };
  }

  let state = 'v0';
  const trace = [];

  // Process 'V'
  if (upper[0] === 'V') {
    trace.push({ char: upper[0], charClass: 'V', fromState: 'v0', toState: 'v1' });
    state = 'v1';
  } else {
    return { valid: false, finalState: 'v_reject', details: `DFA rejected at char 0: expected 'V', got '${upper[0]}'` };
  }

  // Process digit 1
  if (/[0-9]/.test(upper[1])) {
    trace.push({ char: upper[1], charClass: '0-9', fromState: 'v1', toState: 'v2' });
    state = 'v2';
  } else {
    return { valid: false, finalState: 'v_reject', details: `DFA rejected at char 1: expected digit, got '${upper[1]}'` };
  }

  // Process digit 2
  if (/[0-9]/.test(upper[2])) {
    trace.push({ char: upper[2], charClass: '0-9', fromState: 'v2', toState: 'v3' });
    state = 'v3';
  } else {
    return { valid: false, finalState: 'v_reject', details: `DFA rejected at char 2: expected digit, got '${upper[2]}'` };
  }

  // Process '-'
  if (upper[3] === '-') {
    trace.push({ char: upper[3], charClass: '-', fromState: 'v3', toState: 'v4' });
    state = 'v4';
  } else {
    return { valid: false, finalState: 'v_reject', details: `DFA rejected at char 3: expected '-', got '${upper[3]}'` };
  }

  // Process CATEGORY
  const category = upper.slice(4);
  if (VALID_CATEGORIES.includes(category)) {
    trace.push({ char: category, charClass: 'CATEGORY', fromState: 'v4', toState: 'v_accept' });
    state = 'v_accept';
  } else {
    trace.push({ char: category, charClass: '?', fromState: 'v4', toState: 'v_reject' });
    state = 'v_reject';
    return {
      valid: false,
      finalState: 'v_reject',
      extractedCategory: category,
      details: `DFA rejected: '${category}' is not a valid category. Supported: ${VALID_CATEGORIES.join(', ')}`
    };
  }

  return {
    valid: state === 'v_accept',
    finalState: state,
    acceptStates: ['v_accept'],
    extractedCategory: category,
    trace,
    details: `DFA accepted: V + '${upper.slice(1,3)}' + '-' + '${category}'`
  };
}

// ─────────────────────────────────────────────────────────────
// REGEX Validation (equivalent regular expressions)
// Inspector ID: /^INS[A-Z]{2}[0-9]{4}$/i
// Violation Code: /^V[0-9]{2}-(CRITICAL|MAJOR|MINOR|ADVISORY|PASSED)$/i
// ─────────────────────────────────────────────────────────────

const INSPECTOR_ID_REGEX = /^INS[A-Z]{2}[0-9]{4}$/i;
const VIOLATION_CODE_REGEX = /^V[0-9]{2}-(CRITICAL|MAJOR|MINOR|ADVISORY|PASSED)$/i;

function validateInspectorIdRegex(input) {
  const isValid = INSPECTOR_ID_REGEX.test(input);
  return {
    valid: isValid,
    pattern: INSPECTOR_ID_REGEX.toString(),
    details: isValid
      ? `Regex matched: '${input}' conforms to INS[A-Z]{2}[0-9]{4}`
      : `Regex rejected: '${input}' does not match /^INS[A-Z]{2}[0-9]{4}$/i`
  };
}

function validateViolationCodeRegex(input) {
  const isValid = VIOLATION_CODE_REGEX.test(input);
  const match = input ? input.toUpperCase().match(/^V[0-9]{2}-(.+)$/) : null;
  const extractedCategory = match ? match[1] : null;
  return {
    valid: isValid,
    pattern: VIOLATION_CODE_REGEX.toString(),
    extractedCategory: isValid ? extractedCategory : null,
    details: isValid
      ? `Regex matched: '${input}' conforms to V[0-9]{2}-[CATEGORY]`
      : `Regex rejected: '${input}' does not match /^V[0-9]{2}-(CRITICAL|MAJOR|MINOR|ADVISORY|PASSED)$/i`
  };
}

// ─────────────────────────────────────────────────────────────
// Combined validation with DFA + Regex agreement check
// ─────────────────────────────────────────────────────────────
function validateIdentifiers(inspectorId, violationCode) {
  const dfaInspector = simulateInspectorIdDFA(inspectorId);
  const dfaViolation = simulateViolationCodeDFA(violationCode);
  const regexInspector = validateInspectorIdRegex(inspectorId);
  const regexViolation = validateViolationCodeRegex(violationCode);

  const inspectorAgreement = dfaInspector.valid === regexInspector.valid;
  const violationAgreement = dfaViolation.valid === regexViolation.valid;
  const overallAgreement = inspectorAgreement && violationAgreement;

  const isValid = dfaInspector.valid && dfaViolation.valid;

  // Extract category from violation code
  let extractedCategory = null;
  if (dfaViolation.valid) {
    extractedCategory = dfaViolation.extractedCategory;
  } else if (regexViolation.valid) {
    extractedCategory = regexViolation.extractedCategory;
  }

  return {
    isValid,
    inspectorId: {
      input: inspectorId,
      dfa: dfaInspector,
      regex: regexInspector,
      agreement: inspectorAgreement
    },
    violationCode: {
      input: violationCode,
      dfa: dfaViolation,
      regex: regexViolation,
      agreement: violationAgreement
    },
    dfaRegexAgreement: overallAgreement,
    extractedCategory,
    summary: isValid
      ? `Both identifiers valid. DFA and Regex ${overallAgreement ? 'agree' : 'disagree'}.`
      : `Validation failed. ${!dfaInspector.valid ? 'Inspector ID invalid. ' : ''}${!dfaViolation.valid ? 'Violation Code invalid.' : ''}`
  };
}

module.exports = {
  simulateInspectorIdDFA,
  simulateViolationCodeDFA,
  validateInspectorIdRegex,
  validateViolationCodeRegex,
  validateIdentifiers,
  VALID_CATEGORIES,
  INSPECTOR_ID_REGEX,
  VIOLATION_CODE_REGEX,
  INSPECTOR_DFA,
  VIOLATION_DFA
};

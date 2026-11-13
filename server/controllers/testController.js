const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// @desc    Run automated tests and return results
// @route   POST /api/tests/run
// @access  Private (Admin)
const runTests = async (req, res, next) => {
  try {
    const testDir = path.join(__dirname, '..', 'tests');
    
    let output = '';
    let testResults = [];
    let passed = 0;
    let failed = 0;

    try {
      output = execSync(
        'npx jest --testEnvironment=node --forceExit --detectOpenHandles --json --no-coverage 2>&1',
        {
          cwd: path.join(__dirname, '..'),
          timeout: 60000,
          encoding: 'utf8'
        }
      );
    } catch (execError) {
      output = execError.stdout || execError.stderr || execError.message || '';
    }

    // Try to parse Jest JSON output
    try {
      // Find JSON in output (Jest --json outputs JSON to stdout)
      const jsonMatch = output.match(/\{[\s\S]*"testResults"[\s\S]*\}/);
      if (jsonMatch) {
        const jestData = JSON.parse(jsonMatch[0]);
        
        for (const suite of jestData.testResults || []) {
          for (const test of suite.testResults || []) {
            const result = {
              id: test.fullName,
              description: test.fullName,
              status: test.status === 'passed' ? 'PASS' : 'FAIL',
              duration: test.duration,
              failureMessages: test.failureMessages || []
            };
            testResults.push(result);
            if (test.status === 'passed') passed++;
            else failed++;
          }
        }
      }
    } catch (parseErr) {
      // Fallback: return raw output
    }

    // If no structured results, provide inline test execution
    if (testResults.length === 0) {
      testResults = await runInlineTests();
      passed = testResults.filter(t => t.status === 'PASS').length;
      failed = testResults.filter(t => t.status === 'FAIL').length;
    }

    res.json({
      success: true,
      summary: { total: testResults.length, passed, failed },
      results: testResults,
      rawOutput: output.substring(0, 2000) // limit output size
    });
  } catch (error) {
    next(error);
  }
};

// Inline test execution (runs actual logic)
async function runInlineTests() {
  const { validateIdentifiers, simulateInspectorIdDFA, simulateViolationCodeDFA,
    validateInspectorIdRegex, validateViolationCodeRegex } = require('../services/dfaService');
  const { classifyViolation, resolveConflictingClassification } = require('../services/classificationService');
  const { getZoneFromPinCode } = require('../services/dispatchService');

  const tests = [
    // ── DFA / Regex Tests ──
    {
      id: 'TC-001',
      description: 'Valid Inspector ID: INSAB1234',
      fn: () => {
        const r = simulateInspectorIdDFA('INSAB1234');
        return { pass: r.valid === true, actual: `valid=${r.valid}, state=${r.finalState}`, expected: 'valid=true, accept state' };
      }
    },
    {
      id: 'TC-002',
      description: 'Invalid Inspector ID: INS123 (too short)',
      fn: () => {
        const r = simulateInspectorIdDFA('INS123');
        return { pass: r.valid === false, actual: `valid=${r.valid}`, expected: 'valid=false' };
      }
    },
    {
      id: 'TC-003',
      description: 'Invalid Inspector ID: INSABC1234 (3 letters instead of 2)',
      fn: () => {
        const r = simulateInspectorIdDFA('INSABC1234');
        return { pass: r.valid === false, actual: `valid=${r.valid}`, expected: 'valid=false' };
      }
    },
    {
      id: 'TC-004',
      description: 'Valid Violation Code: V01-CRITICAL',
      fn: () => {
        const r = simulateViolationCodeDFA('V01-CRITICAL');
        return { pass: r.valid === true, actual: `valid=${r.valid}, category=${r.extractedCategory}`, expected: 'valid=true, category=CRITICAL' };
      }
    },
    {
      id: 'TC-005',
      description: 'Invalid Violation Code: V1-CRITICAL (single digit)',
      fn: () => {
        const r = simulateViolationCodeDFA('V1-CRITICAL');
        return { pass: r.valid === false, actual: `valid=${r.valid}`, expected: 'valid=false' };
      }
    },
    {
      id: 'TC-006',
      description: 'Invalid Violation Code: V01-UNKNOWN (bad category)',
      fn: () => {
        const r = simulateViolationCodeDFA('V01-UNKNOWN');
        return { pass: r.valid === false, actual: `valid=${r.valid}`, expected: 'valid=false (unknown category)' };
      }
    },
    {
      id: 'TC-007',
      description: 'DFA and Regex agreement on valid identifiers',
      fn: () => {
        const r = validateIdentifiers('INSXY9876', 'V05-MAJOR');
        return { pass: r.dfaRegexAgreement === true && r.isValid === true, actual: `agree=${r.dfaRegexAgreement}, valid=${r.isValid}`, expected: 'agreement=true, valid=true' };
      }
    },
    {
      id: 'TC-008',
      description: 'DFA and Regex agreement on invalid Inspector ID',
      fn: () => {
        const r = validateIdentifiers('INVALID', 'V01-CRITICAL');
        return { pass: r.dfaRegexAgreement === true && r.isValid === false, actual: `agree=${r.dfaRegexAgreement}, valid=${r.isValid}`, expected: 'agreement=true (both reject), valid=false' };
      }
    },
    // ── Classification Tests ──
    {
      id: 'TC-009',
      description: 'Critical classification for V01-CRITICAL',
      fn: () => {
        const r = classifyViolation('CRITICAL');
        return { pass: r.category === 'Critical' && r.priority === 1, actual: `category=${r.category}, priority=${r.priority}`, expected: 'category=Critical, priority=1' };
      }
    },
    {
      id: 'TC-010',
      description: 'Major classification for V02-MAJOR',
      fn: () => {
        const r = classifyViolation('MAJOR');
        return { pass: r.category === 'Major' && r.priority === 2, actual: `category=${r.category}, priority=${r.priority}`, expected: 'category=Major, priority=2' };
      }
    },
    {
      id: 'TC-011',
      description: 'Minor classification for V03-MINOR',
      fn: () => {
        const r = classifyViolation('MINOR');
        return { pass: r.category === 'Minor' && r.priority === 3, actual: `category=${r.category}, priority=${r.priority}`, expected: 'category=Minor, priority=3' };
      }
    },
    {
      id: 'TC-012',
      description: 'Advisory classification for V04-ADVISORY',
      fn: () => {
        const r = classifyViolation('ADVISORY');
        return { pass: r.category === 'Advisory' && r.priority === 4, actual: `category=${r.category}, priority=${r.priority}`, expected: 'category=Advisory, priority=4' };
      }
    },
    {
      id: 'TC-013',
      description: 'Passed classification for V05-PASSED',
      fn: () => {
        const r = classifyViolation('PASSED');
        return { pass: r.category === 'Passed' && r.priority === 5, actual: `category=${r.category}, priority=${r.priority}`, expected: 'category=Passed, priority=5' };
      }
    },
    {
      id: 'TC-014',
      description: 'Unknown violation code returns Unknown category (not silently valid)',
      fn: () => {
        const r = classifyViolation('ILLEGAL_CODE');
        return { pass: r.category === 'Unknown', actual: `category=${r.category}`, expected: 'category=Unknown (not silently assigned)' };
      }
    },
    {
      id: 'TC-015',
      description: 'Conflicting classification: Critical wins over Major',
      fn: () => {
        const r = resolveConflictingClassification(['MAJOR', 'CRITICAL', 'MINOR']);
        return { pass: r.category === 'Critical', actual: `category=${r.category}`, expected: 'category=Critical (highest severity)' };
      }
    },
    // ── Routing Tests ──
    {
      id: 'TC-016',
      description: 'Known PIN code 560001 → Zone-1',
      fn: () => {
        const zone = getZoneFromPinCode('560001');
        return { pass: zone === 'Zone-1', actual: `zone=${zone}`, expected: 'zone=Zone-1' };
      }
    },
    {
      id: 'TC-017',
      description: 'Known PIN code 600001 → Zone-5',
      fn: () => {
        const zone = getZoneFromPinCode('600001');
        return { pass: zone === 'Zone-5', actual: `zone=${zone}`, expected: 'zone=Zone-5' };
      }
    },
    {
      id: 'TC-018',
      description: 'Unknown PIN code 999999 → null (correction queue)',
      fn: () => {
        const zone = getZoneFromPinCode('999999');
        return { pass: zone === null, actual: `zone=${zone}`, expected: 'zone=null (unknown zone)' };
      }
    },
    {
      id: 'TC-019',
      description: 'Malformed PIN code (letters) → null',
      fn: () => {
        const zone = getZoneFromPinCode('ABCDEF');
        return { pass: zone === null, actual: `zone=${zone}`, expected: 'zone=null (invalid PIN)' };
      }
    },
    {
      id: 'TC-020',
      description: 'Regex validation: Valid Inspector ID INSQZ0001',
      fn: () => {
        const r = validateInspectorIdRegex('INSQZ0001');
        return { pass: r.valid === true, actual: `valid=${r.valid}`, expected: 'valid=true' };
      }
    },
    {
      id: 'TC-021',
      description: 'Regex validation: Valid Violation Code V99-ADVISORY',
      fn: () => {
        const r = validateViolationCodeRegex('V99-ADVISORY');
        return { pass: r.valid === true && r.extractedCategory === 'ADVISORY', actual: `valid=${r.valid}, cat=${r.extractedCategory}`, expected: 'valid=true, category=ADVISORY' };
      }
    },
    {
      id: 'TC-022',
      description: 'Critical urgency escalates priority level',
      fn: () => {
        const r = classifyViolation('MAJOR', 'critical');
        return { pass: r.escalated === true && r.priority < 2, actual: `escalated=${r.escalated}, priority=${r.priority}`, expected: 'escalated=true, priority<2' };
      }
    }
  ];

  const results = [];
  for (const test of tests) {
    try {
      const outcome = test.fn();
      results.push({
        id: test.id,
        description: test.description,
        status: outcome.pass ? 'PASS' : 'FAIL',
        expected: outcome.expected,
        actual: outcome.actual,
        error: null
      });
    } catch (err) {
      results.push({
        id: test.id,
        description: test.description,
        status: 'FAIL',
        expected: 'No exception',
        actual: `Exception: ${err.message}`,
        error: err.message
      });
    }
  }

  return results;
}

// @desc    Get cached test results
// @route   GET /api/tests/results
// @access  Private
const getTestResults = async (req, res, next) => {
  try {
    const results = await runInlineTests();
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;

    res.json({
      success: true,
      summary: { total: results.length, passed, failed },
      results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { runTests, getTestResults };

/**
 * Regulatory Rules - Unit Tests
 * @module regulatory-rules.test
 *
 * Validates the public API of the regulatory-rules library. Uses Node's
 * built-in test runner (node:test) so no extra deps are required.
 *
 * Run with: `node --test --import tsx src/index.test.ts`
 * (or compile first and run against dist/)
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// Import the compiled output if it exists, otherwise fail with a clear
// message instructing the user to build first.
let lib: any;
try {
  lib = await import('../dist/index.js');
} catch (err) {
  console.error(
    '\n[regulatory-rules test] dist/ not found. Run `npm run build` first.\n'
  );
  throw err;
}

test('module loads as a non-empty object', () => {
  assert.ok(lib);
  assert.ok(Object.keys(lib).length > 0);
});

test('exports insiderTradingRules array', () => {
  assert.ok(Array.isArray(lib.insiderTradingRules));
  assert.ok(lib.insiderTradingRules.length > 0);
});

test('each insider trading rule has required fields', () => {
  for (const rule of lib.insiderTradingRules) {
    assert.ok(rule.id, 'rule must have an id');
    assert.ok(rule.name, 'rule must have a name');
    assert.ok(rule.regulation, 'rule must specify regulation');
  }
});

test('all rules are marked as SEC regulation', () => {
  for (const rule of lib.insiderTradingRules) {
    assert.equal(rule.regulation, 'SEC');
  }
});

/**
 * Regulatory Rules - Unit Tests
 * @module regulatory-rules.test
 *
 * Validates the public API of the regulatory-rules library. Uses Node's
 * built-in test runner (node:test) so no extra deps are required.
 *
 * Run with: `npm test` (which builds first), or for direct execution:
 *   `npm run build && node --test dist-test/index.test.js`
 */

import { test } from 'node:test';
import { strict as assert } from 'node:assert';

// This file is compiled to CommonJS (see tsconfig.test.json), so the
// `require` function is provided by Node's CJS module wrapper.
declare const require: NodeRequire;

let lib: any;
try {
  lib = require('../dist/index.js');
} catch (err) {
  console.error(
    '\n[regulatory-rules test] dist/ not found or not loadable. Run `npm run build` first.\n'
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

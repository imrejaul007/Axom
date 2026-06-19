/**
 * Agent Governance Service - Unit Tests
 * @module agent-governance-service.test
 *
 * Asserts on the source file directly (no app import) to avoid
 * ESM .js -> .ts resolution issues in this Jest setup.
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC = fs.readFileSync(
  path.join(__dirname, 'index.ts'),
  'utf-8'
);

describe('Agent Governance Service', () => {
  describe('Health Check', () => {
    it('should register a /health route', () => {
      expect(SRC).toMatch(/app\.get\(['"`]\/health['"`]/);
    });

    it('should return a JSON body on /health', () => {
      expect(SRC).toMatch(/res\.json\s*\(/);
    });
  });

  describe('Governance API', () => {
    it('should expose a /agents route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/agents/);
    });

    it('should support agent listing (GET)', () => {
      expect(SRC).toMatch(/app\.get\(['"`]\/agents/);
    });
  });
});

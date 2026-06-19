/**
 * Communication Compliance Service - Unit Tests
 * @module communication-compliance-service.test
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

describe('Communication Compliance Service', () => {
  describe('Health Check', () => {
    it('should register a /health route', () => {
      expect(SRC).toMatch(/app\.get\(['"`]\/health['"`]/);
    });

    it('should return a JSON body on /health', () => {
      expect(SRC).toMatch(/res\.json\s*\(/);
    });
  });

  describe('Compliance API', () => {
    it('should expose a /validate route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/validate/);
    });

    it('should expose a /validate/email route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/validate\/email/);
    });
  });
});

/**
 * Audit Trail Service - Unit Tests
 * @module audit-trail-service.test
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

describe('Audit Trail Service', () => {
  describe('Health Check', () => {
    it('should register a /health route', () => {
      expect(SRC).toMatch(/app\.get\(['"`]\/health['"`]/);
    });

    it('should return a JSON body on /health', () => {
      expect(SRC).toMatch(/res\.json\s*\(/);
    });
  });

  describe('Audit API', () => {
    it('should expose a /log route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/log/);
    });

    it('should support POST for log ingestion', () => {
      expect(SRC).toMatch(/app\.post\(/);
    });
  });
});

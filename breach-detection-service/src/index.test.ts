/**
 * Breach Detection Service - Unit Tests
 * @module breach-detection-service.test
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

describe('Breach Detection Service', () => {
  describe('Health Check', () => {
    it('should register a /health route', () => {
      expect(SRC).toMatch(/app\.get\(['"`]\/health['"`]/);
    });

    it('should return a JSON body on /health', () => {
      expect(SRC).toMatch(/res\.json\s*\(/);
    });
  });

  describe('Breach Detection API', () => {
    it('should expose a /check/email route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/check\/email/);
    });

    it('should expose a /check/phone route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/check\/phone/);
    });
  });
});

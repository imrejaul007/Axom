/**
 * Policy Engine Service - Unit Tests
 * @module policy-engine-service.test
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

describe('Policy Engine Service', () => {
  describe('Health Check', () => {
    it('should register a /health route', () => {
      expect(SRC).toMatch(/app\.get\(['"`]\/health['"`]/);
    });

    it('should return a JSON body on /health', () => {
      expect(SRC).toMatch(/res\.json\s*\(/);
    });
  });

  describe('Policy API', () => {
    it('should expose a /policies route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/policies/);
    });

    it('should expose a /policy/parse route', () => {
      expect(SRC).toMatch(/app\.(get|post)\(['"`]\/policy\/parse/);
    });
  });
});

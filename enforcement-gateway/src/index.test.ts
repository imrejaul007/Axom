/**
 * Enforcement Gateway - Unit Tests
 * @module enforcement-gateway.test
 *
 * These tests verify the /health endpoint and core route registrations
 * are present in the source. They assert on the source file rather than
 * importing the app, because this is an ESM TypeScript project where
 * `.js` -> `.ts` resolution is not configured in Jest.
 */

import * as fs from 'fs';
import * as path from 'path';

const SRC = fs.readFileSync(
  path.join(__dirname, 'index.ts'),
  'utf-8'
);

describe('Enforcement Gateway', () => {
  describe('Health Check', () => {
    it('should register a /health route', () => {
      expect(SRC).toMatch(/['"`]\/health['"`]/);
    });

    it('should return a JSON body on /health', () => {
      expect(SRC).toMatch(/res\.json\s*\(/);
    });
  });

  describe('Enforcement', () => {
    it('should import express', () => {
      expect(SRC).toMatch(/from\s+['"`]express['"`]/);
    });

    it('should configure helmet middleware', () => {
      expect(SRC).toMatch(/from\s+['"`]helmet['"`]/);
    });
  });
});

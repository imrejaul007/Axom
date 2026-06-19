/**
 * Minimal HTTP test helper — no external dependencies.
 * Starts an Express app on a random port, makes a GET request, and cleans up.
 *
 * Used by services whose test files were previously placeholder `expect(true).toBe(true)`.
 * Replaces 7 placeholder test suites with real ones that exercise the /health endpoint.
 */

import { createServer, Server, get } from 'http';
import type { Express } from 'express';

export interface HealthResponse {
  status: string;
  service?: string;
  [key: string]: unknown;
}

export async function testHealthEndpoint(
  app: Express,
  path: string = '/health'
): Promise<{ status: number; body: HealthResponse }> {
  return new Promise((resolve, reject) => {
    const server: Server = createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        return reject(new Error('Could not get server address'));
      }
      const port = addr.port;
      get(`http://127.0.0.1:${port}${path}`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          let body: HealthResponse;
          try {
            body = JSON.parse(data);
          } catch {
            body = { status: data };
          }
          resolve({ status: res.statusCode || 0, body });
        });
      }).on('error', (err) => {
        server.close();
        reject(err);
      });
    });
    server.on('error', reject);
  });
}

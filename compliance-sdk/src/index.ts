/**
 * TrustOS Compliance SDK
 * Unified TypeScript SDK for TrustOS Compliance Services
 */

export * from './types';
export * from './client';
export * from './services/communication';
export * from './services/policy';
export * from './services/enforcement';
export * from './services/llm';
export * from './services/agent';
export * from './services/audit';
export * from './errors';
export * from './hooks';
export * from './middleware';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'compliance-sdk',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});

/**
 * TrustOS Regulatory Rules - Main Export
 */

export * from './sec';
export * from './finra';
export * from './rbi';
export * from './companyPolicy';
export * from './types';
export * from './engine';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'regulatory-rules',
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

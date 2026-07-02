/**
 * SocietyOS API Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import mongoose from 'mongoose';

// Mock app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());

  // Mock routes
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'buzzlocal-society-service' });
  });

  app.get('/api/societies', (req, res) => {
    res.json({
      success: true,
      societies: [
        {
          _id: 'test-society-1',
          name: 'Test Society',
          type: 'apartment',
          memberCount: 10
        }
      ]
    });
  });

  app.post('/api/societies', (req, res) => {
    const society = {
      _id: 'new-society-id',
      ...req.body,
      adminIds: ['test-user'],
      memberCount: 1
    };
    res.status(201).json({ success: true, society });
  });

  return app;
};

describe('SocietyOS API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch('http://localhost:4019/health');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });
  });

  describe('GET /api/societies', () => {
    it('should return list of societies', async () => {
      const response = await fetch('http://localhost:4019/api/societies');
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.societies)).toBe(true);
    });
  });

  describe('POST /api/societies', () => {
    it('should create a new society', async () => {
      const newSociety = {
        name: 'New Test Society',
        type: 'apartment',
        address: {
          street: 'Test Street',
          area: 'Test Area',
          city: 'Test City',
          pincode: '123456'
        },
        location: { lat: 12.97, lng: 77.59 }
      };

      const response = await fetch('http://localhost:4019/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSociety)
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.society).toBeDefined();
      expect(data.society.name).toBe(newSociety.name);
    });

    it('should reject invalid society data', async () => {
      const invalidSociety = {
        name: 'AB', // Too short
        type: 'invalid-type'
      };

      const response = await fetch('http://localhost:4019/api/societies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidSociety)
      });

      expect(response.status).toBe(400);
    });
  });
});

describe('Visitor Management', () => {
  let societyId: string;

  beforeAll(async () => {
    // Create a society for testing
    const response = await fetch('http://localhost:4019/api/societies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Visitor Test Society',
        type: 'apartment',
        address: { street: 'Test', area: 'Test', city: 'Test', pincode: '123' },
        location: { lat: 12.97, lng: 77.59 }
      })
    });
    const data = await response.json();
    societyId = data.society._id;
  });

  describe('POST /api/societies/:id/visitors', () => {
    it('should add a visitor', async () => {
      const visitor = {
        visitorName: 'Test Visitor',
        visitorPhone: '9876543210',
        purpose: 'family',
        expectedDate: '2026-07-03',
        flatNumber: 'A-101'
      };

      const response = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'test-user-001'
          },
          body: JSON.stringify(visitor)
        }
      );

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.visitor.visitorName).toBe(visitor.visitorName);
    });
  });

  describe('POST /api/societies/:id/visitors/:visitorId/generate-qr', () => {
    it('should generate QR pass', async () => {
      // First add a visitor
      const addResponse = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'test-user-001'
          },
          body: JSON.stringify({
            visitorName: 'QR Test Visitor',
            purpose: 'delivery',
            expectedDate: '2026-07-03',
            flatNumber: 'B-202'
          })
        }
      );

      const visitorData = await addResponse.json();
      const visitorId = visitorData.visitor._id;

      // Generate QR
      const qrResponse = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors/${visitorId}/generate-qr`,
        {
          method: 'POST',
          headers: { 'x-user-id': 'test-user-001' }
        }
      );

      const qrData = await qrResponse.json();

      expect(qrResponse.status).toBe(200);
      expect(qrData.success).toBe(true);
      expect(qrData.qrPass).toBeDefined();
      expect(qrData.qrPass.qrCode).toBeDefined();
      expect(qrData.qrPass.qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('POST /api/societies/:id/visitors/verify-qr', () => {
    it('should verify valid QR token', async () => {
      // Create visitor and generate QR
      const addResponse = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'test-user-001'
          },
          body: JSON.stringify({
            visitorName: 'Verify Test',
            purpose: 'friend',
            expectedDate: '2026-07-03',
            flatNumber: 'C-303'
          })
        }
      );

      const visitorData = await addResponse.json();
      const visitorId = visitorData.visitor._id;

      // Generate QR
      const qrResponse = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors/${visitorId}/generate-qr`,
        {
          method: 'POST',
          headers: { 'x-user-id': 'test-user-001' }
        }
      );

      const qrData = await qrResponse.json();
      const token = qrData.qrPass.qrToken;

      // Verify QR
      const verifyResponse = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors/verify-qr`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'guard-001'
          },
          body: JSON.stringify({ qrToken: token })
        }
      );

      const verifyData = await verifyResponse.json();

      expect(verifyResponse.status).toBe(200);
      expect(verifyData.verified).toBe(true);
      expect(verifyData.visitor.name).toBe('Verify Test');
    });

    it('should reject invalid QR token', async () => {
      const verifyResponse = await fetch(
        `http://localhost:4019/api/societies/${societyId}/visitors/verify-qr`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrToken: 'invalid-token' })
        }
      );

      const data = await verifyResponse.json();

      expect(data.verified).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});

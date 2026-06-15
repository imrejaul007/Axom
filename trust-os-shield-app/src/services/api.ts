/**
 * TrustOS Shield - API Service
 */

import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:4166'; // TrustOS Gateway

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'trust-os-shield-app',
    'X-SDK-Version': '1.0.0',
  },
});

// ============================================
// TRUST SCORE
// ============================================

export async function getTrustScore(userId: string): Promise<any> {
  try {
    const response = await api.get(`/api/v1/trust/score/person/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get trust score:', error);
    throw error;
  }
}

// ============================================
// SCAM DETECTION
// ============================================

export async function checkSMS(content: string, sender?: string): Promise<any> {
  try {
    const response = await api.post('/api/v1/scam/check-sms', { content, sender });
    return response.data.data;
  } catch (error) {
    console.error('Failed to check SMS:', error);
    throw error;
  }
}

export async function checkWhatsApp(content: string, sender?: string): Promise<any> {
  try {
    const response = await api.post('/api/v1/scam/check-whatsapp', { content, sender });
    return response.data.data;
  } catch (error) {
    console.error('Failed to check WhatsApp:', error);
    throw error;
  }
}

export async function checkLink(url: string): Promise<any> {
  try {
    const response = await api.post('/api/v1/scam/check-link', { url });
    return response.data.data;
  } catch (error) {
    console.error('Failed to check link:', error);
    throw error;
  }
}

export async function checkPhone(phone: string): Promise<any> {
  try {
    const response = await api.post('/api/v1/call/check', { phone });
    return response.data.data;
  } catch (error) {
    console.error('Failed to check phone:', error);
    throw error;
  }
}

export async function reportScam(data: {
  type: 'sms' | 'call' | 'link' | 'whatsapp';
  content?: string;
  sender?: string;
  url?: string;
  description?: string;
}): Promise<any> {
  try {
    const response = await api.post('/api/v1/scam/report', data);
    return response.data.data;
  } catch (error) {
    console.error('Failed to report scam:', error);
    throw error;
  }
}

// ============================================
// BREACH DETECTION
// ============================================

export async function checkBreach(email: string): Promise<any> {
  try {
    const response = await api.post('/breach/check', { email });
    return response.data.data;
  } catch (error) {
    console.error('Failed to check breach:', error);
    throw error;
  }
}

export async function getBreachAlerts(userId: string): Promise<any> {
  try {
    const response = await api.get(`/shield/breaches/${userId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get breach alerts:', error);
    throw error;
  }
}

// ============================================
// FRAUD CHECK
// ============================================

export async function checkFraud(transactionData: {
  transactionId: string;
  amount: number;
  currency: string;
  userId?: string;
  merchantId?: string;
}): Promise<any> {
  try {
    const response = await api.post('/api/v1/fraud/check', transactionData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to check fraud:', error);
    throw error;
  }
}

export default api;

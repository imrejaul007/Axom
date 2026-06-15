/**
 * BuzzLocal → RABTUL Platform Integration
 *
 * Uses existing RABTUL services:
 * - Auth (4002) - JWT, OTP, MFA
 * - Wallet (4004) - Coins, Balance
 * - Payment (4001) - UPI, Razorpay
 * - Notifications (4011) - Push, SMS
 */

import axios from 'axios';

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4002';
const WALLET_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:4004';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4001';
const NOTIFY_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4011';
const TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

const HEADERS = {
  'Content-Type': 'application/json',
  'X-Internal-Token': TOKEN,
  'X-Source': 'buzzlocal',
};

// ===== AUTH SERVICE =====

export const authService = {
  async verify(token: string) {
    const { data } = await axios.post(`${AUTH_URL}/api/auth/verify`, { token }, { headers: HEADERS });
    return data;
  },

  async register(email: string, phone: string, password: string) {
    const { data } = await axios.post(`${AUTH_URL}/api/auth/register`, { email, phone, password }, { headers: HEADERS });
    return data;
  },

  async login(identity: string, password: string) {
    const { data } = await axios.post(`${AUTH_URL}/api/auth/login`, { identity, password }, { headers: HEADERS });
    return data;
  },

  async sendOTP(phone: string) {
    const { data } = await axios.post(`${AUTH_URL}/api/auth/otp/send`, { phone }, { headers: HEADERS });
    return data;
  },

  async verifyOTP(phone: string, otp: string) {
    const { data } = await axios.post(`${AUTH_URL}/api/auth/otp/verify`, { phone, otp }, { headers: HEADERS });
    return data;
  },

  async refresh(token: string) {
    const { data } = await axios.post(`${AUTH_URL}/api/auth/refresh`, { token }, { headers: HEADERS });
    return data;
  },
};

// ===== WALLET SERVICE =====

export const walletService = {
  async getBalance(userId: string) {
    const { data } = await axios.get(`${WALLET_URL}/api/wallet/${userId}`, { headers: HEADERS });
    return data;
  },

  async getTransactions(userId: string, limit = 50) {
    const { data } = await axios.get(`${WALLET_URL}/api/transactions/${userId}?limit=${limit}`, { headers: HEADERS });
    return data;
  },

  async addCoins(userId: string, amount: number, type: 'REZ' | 'PROMO' | 'BRANDED' | 'PRIVE' | 'CASHBACK' | 'REFERRAL', reason: string) {
    const { data } = await axios.post(`${WALLET_URL}/api/coins/add`, { userId, amount, type, reason }, { headers: HEADERS });
    return data;
  },

  async deductCoins(userId: string, amount: number, type: 'REZ' | 'PROMO' | 'BRANDED' | 'PRIVE' | 'CASHBACK' | 'REFERRAL', reason: string) {
    const { data } = await axios.post(`${WALLET_URL}/api/coins/deduct`, { userId, amount, type, reason }, { headers: HEADERS });
    return data;
  },

  async transfer(fromUserId: string, toUserId: string, amount: number, type: 'REZ' | 'PROMO' | 'BRANDED') {
    const { data } = await axios.post(`${WALLET_URL}/api/transfer`, { fromUserId, toUserId, amount, type }, { headers: HEADERS });
    return data;
  },

  async getSavings(userId: string) {
    const { data } = await axios.get(`${WALLET_URL}/api/savings/${userId}`, { headers: HEADERS });
    return data;
  },
};

// ===== PAYMENT SERVICE =====

export const paymentService = {
  async createOrder(userId: string, amount: number, currency = 'INR', metadata?: Record<string, unknown>) {
    const { data } = await axios.post(`${PAYMENT_URL}/api/orders/create`, { userId, amount, currency, metadata }, { headers: HEADERS });
    return data;
  },

  async verifyPayment(paymentId: string, orderId: string, amount: number) {
    const { data } = await axios.post(`${PAYMENT_URL}/api/payments/verify`, { paymentId, orderId, amount }, { headers: HEADERS });
    return data;
  },

  async getPaymentStatus(paymentId: string) {
    const { data } = await axios.get(`${PAYMENT_URL}/api/payments/${paymentId}`, { headers: HEADERS });
    return data;
  },

  async createUPIOrder(userId: string, amount: number, vpa: string) {
    const { data } = await axios.post(`${PAYMENT_URL}/api/upi/create`, { userId, amount, vpa }, { headers: HEADERS });
    return data;
  },
};

// ===== NOTIFICATION SERVICE =====

export const notificationService = {
  async sendPush(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const { data: result } = await axios.post(`${NOTIFY_URL}/api/push`, { userId, title, body, data }, { headers: HEADERS });
    return result;
  },

  async sendSMS(phone: string, message: string) {
    const { data } = await axios.post(`${NOTIFY_URL}/api/sms`, { phone, message }, { headers: HEADERS });
    return data;
  },

  async sendWhatsApp(phone: string, template: string, variables?: Record<string, string>) {
    const { data } = await axios.post(`${NOTIFY_URL}/api/whatsapp`, { phone, template, variables }, { headers: HEADERS });
    return data;
  },

  async sendEmail(to: string, subject: string, html: string) {
    const { data } = await axios.post(`${NOTIFY_URL}/api/email`, { to, subject, html }, { headers: HEADERS });
    return data;
  },

  async getPreferences(userId: string) {
    const { data } = await axios.get(`${NOTIFY_URL}/api/preferences/${userId}`, { headers: HEADERS });
    return data;
  },

  async updatePreferences(userId: string, preferences: Record<string, boolean>) {
    const { data } = await axios.put(`${NOTIFY_URL}/api/preferences/${userId}`, { preferences }, { headers: HEADERS });
    return data;
  },
};

export default { authService, walletService, paymentService, notificationService };

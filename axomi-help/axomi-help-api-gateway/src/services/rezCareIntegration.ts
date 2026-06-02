/**
 * Axomi Help + REZ Care Integration
 * Connect to REZ Care for Customer 360, CSAT, Sentiment, Proactive Detection
 */

import axios from 'axios';
import { pino } from '../logger.js';

const logger = pino.child({ module: 'REZCareIntegration' });

const CARE_API = process.env.REZ_CARE_URL || 'http://localhost:4058';
const COPILOT_API = process.env.REZ_COPILOT_URL || 'http://localhost:4033';

// ============================================
// TYPES
// ============================================

export interface Customer360 {
  userId: string;
  name: string;
  email?: string;
  phone: string;
  avatar?: string;
  tier: string;
  lifetimeValue: number;
  riskScore: number;
  trustScore: number;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate?: Date;
  firstInteractionDate: Date;
  segments: string[];
  preferences: {
    channel: 'whatsapp' | 'chat' | 'email';
    language: string;
  };
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  brandId: string;
  brandName: string;
  type: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  assignedAgentId?: string;
  assignedAgentName?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  csatRating?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SentimentResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  emotions: {
    anger?: number;
    joy?: number;
    sadness?: number;
    fear?: number;
    surprise?: number;
  };
}

export interface CSATSurvey {
  ticketId: string;
  rating: number; // 1-5
  feedback?: string;
  submittedAt: Date;
}

export interface ProactiveAlert {
  id: string;
  userId: string;
  alertType: 'delayed_order' | 'payment_failure' | 'quality_issue' | 'delivery_problem' | 'service_outage';
  severity: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  actionRequired: boolean;
  actionTaken?: string;
  createdAt: Date;
}

export interface SelfServiceAction {
  actionId: string;
  type: 'cashback_retry' | 'payment_retry' | 'wallet_sync' | 'refund_status' | 'order_cancel' | 'booking_reschedule';
  title: string;
  description: string;
  available: boolean;
}

// ============================================
// REZ CARE INTEGRATION
// ============================================

export class REZCareIntegration {
  // ============================================
  // CUSTOMER 360
  // ============================================

  /**
   * Get complete customer profile from REZ Care
   */
  async getCustomer360(userId: string): Promise<Customer360 | null> {
    try {
      const response = await axios.get(`${CARE_API}/api/customer360/${userId}`);
      logger.info({ userId }, 'Customer 360 retrieved');
      return response.data;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get Customer 360');
      return null;
    }
  }

  /**
   * Get quick customer summary
   */
  async getCustomerSummary(userId: string): Promise<{
    name: string;
    tier: string;
    riskScore: number;
    lastInteraction?: Date;
  } | null> {
    try {
      const response = await axios.get(`${CARE_API}/api/customer360/${userId}/summary`);
      return response.data;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get customer summary');
      return null;
    }
  }

  /**
   * Get customer's ticket history
   */
  async getCustomerTickets(userId: string): Promise<Ticket[]> {
    try {
      const response = await axios.get(`${CARE_API}/api/customer360/${userId}/tickets`);
      return response.data;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get customer tickets');
      return [];
    }
  }

  // ============================================
  // TICKET MANAGEMENT
  // ============================================

  /**
   * Create ticket in REZ Care
   */
  async createTicket(ticket: {
    userId: string;
    brandId: string;
    subject: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    channel?: string;
  }): Promise<Ticket | null> {
    try {
      const response = await axios.post(`${CARE_API}/api/mobile-sdk/tickets`, {
        user_id: ticket.userId,
        company_id: ticket.brandId,
        subject: ticket.subject,
        description: ticket.description,
        priority: ticket.priority || 'medium',
        channel: ticket.channel || 'axomi_help',
        source: 'axomi_help'
      });

      logger.info({ ticketId: response.data.id }, 'Ticket created in REZ Care');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Failed to create ticket');
      return null;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicket(ticketId: string): Promise<Ticket | null> {
    try {
      const response = await axios.get(`${CARE_API}/api/mobile-sdk/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to get ticket');
      return null;
    }
  }

  /**
   * Add response to ticket
   */
  async respondToTicket(ticketId: string, response: string): Promise<boolean> {
    try {
      await axios.post(`${CARE_API}/api/mobile-sdk/tickets/${ticketId}/respond`, {
        response
      });
      return true;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to respond to ticket');
      return false;
    }
  }

  /**
   * Resolve ticket
   */
  async resolveTicket(ticketId: string, resolution?: string): Promise<boolean> {
    try {
      await axios.post(`${CARE_API}/api/mobile-sdk/tickets/${ticketId}/resolve`, {
        resolution
      });
      return true;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to resolve ticket');
      return false;
    }
  }

  // ============================================
  // SENTIMENT ANALYSIS
  // ============================================

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<SentimentResult> {
    try {
      const response = await axios.post(`${CARE_API}/api/sentiment/analyze`, {
        text
      });

      const result = response.data;

      return {
        sentiment: result.sentiment || 'neutral',
        score: result.score || 0,
        confidence: result.confidence || 0.5,
        emotions: result.emotions || {}
      };
    } catch (error) {
      logger.error({ error }, 'Failed to analyze sentiment');
      return {
        sentiment: 'neutral',
        score: 0,
        confidence: 0,
        emotions: {}
      };
    }
  }

  /**
   * Get sentiment trends for customer
   */
  async getSentimentTrends(userId: string, period = '30d'): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    avgScore: number;
    positiveCount: number;
    negativeCount: number;
  } | null> {
    try {
      const response = await axios.get(`${CARE_API}/api/sentiment/trends`, {
        params: { user_id: userId, period }
      });
      return response.data;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get sentiment trends');
      return null;
    }
  }

  // ============================================
  // CSAT (Customer Satisfaction)
  // ============================================

  /**
   * Submit CSAT rating
   */
  async submitCSAT(ticketId: string, rating: number, feedback?: string): Promise<boolean> {
    try {
      await axios.post(`${CARE_API}/api/mobile-sdk/csat`, {
        ticket_id: ticketId,
        rating,
        feedback
      });

      logger.info({ ticketId, rating }, 'CSAT submitted');
      return true;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to submit CSAT');
      return false;
    }
  }

  /**
   * Get pending CSAT surveys for customer
   */
  async getPendingCSATSurveys(userId: string): Promise<{
    ticketId: string;
    ticketSubject: string;
    pendingSince: Date;
  }[]> {
    try {
      const response = await axios.get(`${CARE_API}/api/mobile-sdk/csat/pending`, {
        params: { user_id: userId }
      });
      return response.data;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get pending CSAT');
      return [];
    }
  }

  // ============================================
  // PROACTIVE DETECTION
  // ============================================

  /**
   * Get active proactive alerts for customer
   */
  async getActiveAlerts(userId: string): Promise<ProactiveAlert[]> {
    try {
      const response = await axios.get(`${CARE_API}/api/alerts/active`, {
        params: { user_id: userId }
      });
      return response.data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get active alerts');
      return [];
    }
  }

  /**
   * Check for alert triggers
   */
  async checkAlerts(userId: string): Promise<ProactiveAlert[]> {
    try {
      const response = await axios.post(`${CARE_API}/api/alerts/check`, {
        user_id: userId
      });
      return response.data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to check alerts');
      return [];
    }
  }

  /**
   * Get alert history
   */
  async getAlertHistory(userId: string, limit = 10): Promise<ProactiveAlert[]> {
    try {
      const response = await axios.get(`${CARE_API}/api/alerts/history`, {
        params: { user_id: userId, limit }
      });
      return response.data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get alert history');
      return [];
    }
  }

  // ============================================
  // SELF-SERVICE ACTIONS
  // ============================================

  /**
   * Get available self-service actions
   */
  async getSelfServiceActions(userId: string): Promise<SelfServiceAction[]> {
    try {
      const response = await axios.get(`${CARE_API}/api/mobile/actions`, {
        params: { user_id: userId }
      });
      return response.data || [];
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get self-service actions');
      return [];
    }
  }

  /**
   * Execute self-service action
   */
  async executeSelfServiceAction(
    userId: string,
    actionType: string,
    params: Record<string, unknown>
  ): Promise<{ success: boolean; message: string; result?: unknown }> {
    try {
      const response = await axios.post(`${CARE_API}/api/mobile/execute`, {
        user_id: userId,
        action_type: actionType,
        params
      });

      return {
        success: true,
        message: 'Action executed successfully',
        result: response.data
      };
    } catch (error) {
      logger.error({ error, userId, actionType }, 'Failed to execute self-service action');
      return {
        success: false,
        message: 'Failed to execute action'
      };
    }
  }

  /**
   * Retry payment
   */
  async retryPayment(userId: string, orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      await axios.post(`${CARE_API}/api/mobile/retry-payment`, {
        user_id: userId,
        order_id: orderId
      });

      return { success: true, message: 'Payment retry initiated' };
    } catch (error) {
      logger.error({ error, userId, orderId }, 'Failed to retry payment');
      return { success: false, message: 'Payment retry failed' };
    }
  }

  /**
   * Sync wallet
   */
  async syncWallet(userId: string): Promise<{ success: boolean; balance?: number }> {
    try {
      const response = await axios.post(`${CARE_API}/api/mobile/sync-wallet`, {
        user_id: userId
      });

      return {
        success: true,
        balance: response.data.balance
      };
    } catch (error) {
      logger.error({ error, userId }, 'Failed to sync wallet');
      return { success: false };
    }
  }

  // ============================================
  // KNOWLEDGE BASE
  // ============================================

  /**
   * Search knowledge base
   */
  async searchKnowledge(query: string, brandId?: string): Promise<{
    articles: {
      id: string;
      title: string;
      summary: string;
      helpful: number;
    }[];
    faqs: {
      id: string;
      question: string;
      answer: string;
    }[];
  }> {
    try {
      const response = await axios.get(`${CARE_API}/api/mobile-sdk/knowledge/search`, {
        params: { q: query, company_id: brandId }
      });
      return response.data || { articles: [], faqs: [] };
    } catch (error) {
      logger.error({ error, query }, 'Failed to search knowledge');
      return { articles: [], faqs: [] };
    }
  }

  /**
   * Get knowledge article
   */
  async getArticle(articleId: string): Promise<{
    id: string;
    title: string;
    content: string;
    helpful: number;
  } | null> {
    try {
      const response = await axios.get(`${CARE_API}/api/mobile-sdk/knowledge/${articleId}`);
      return response.data;
    } catch (error) {
      logger.error({ error, articleId }, 'Failed to get article');
      return null;
    }
  }

  // ============================================
  // AGENT MANAGEMENT
  // ============================================

  /**
   * Get agent performance
   */
  async getAgentPerformance(agentId: string): Promise<{
    ticketsResolved: number;
    avgResponseTime: number;
    csatScore: number;
    escalationRate: number;
  } | null> {
    try {
      const response = await axios.get(`${CARE_API}/api/agents/${agentId}/performance`);
      return response.data;
    } catch (error) {
      logger.error({ error, agentId }, 'Failed to get agent performance');
      return null;
    }
  }

  /**
   * Auto-assign ticket to best agent
   */
  async autoAssignTicket(ticketId: string, category?: string): Promise<{
    agentId: string;
    agentName: string;
    estimatedWait: number;
  } | null> {
    try {
      const response = await axios.post(`${CARE_API}/api/agents/assign`, {
        ticket_id: ticketId,
        category
      });
      return response.data;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to auto-assign ticket');
      return null;
    }
  }

  // ============================================
  // ESCALATION
  // ============================================

  /**
   * Check if ticket needs escalation
   */
  async checkEscalation(ticketId: string): Promise<{
    shouldEscalate: boolean;
    reason?: string;
    level?: number;
  }> {
    try {
      const response = await axios.post(`${CARE_API}/api/escalation/check`, {
        ticket_id: ticketId
      });
      return response.data;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to check escalation');
      return { shouldEscalate: false };
    }
  }

  /**
   * Escalate ticket
   */
  async escalateTicket(ticketId: string, reason: string, level = 3): Promise<boolean> {
    try {
      await axios.post(`${CARE_API}/api/escalation/escalate`, {
        ticket_id: ticketId,
        reason,
        level
      });
      return true;
    } catch (error) {
      logger.error({ error, ticketId }, 'Failed to escalate ticket');
      return false;
    }
  }
}

export const rezCareIntegration = new REZCareIntegration();

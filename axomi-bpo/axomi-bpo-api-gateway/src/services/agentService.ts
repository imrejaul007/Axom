import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { pino } from '../logger.js';
import type {
  Agent,
  AgentType,
  AgentRole,
  AgentTier,
  AgentStatus,
  AgentCapability,
  AgentMetrics,
} from '../types/index.js';

const logger = pino.child({ module: 'AgentService' });

const COLLECTION = 'agents';

// Default AI Employees
const DEFAULT_AGENTS: Omit<Agent, '_id'>[] = [
  {
    id: 'agent-support-basic',
    name: 'Support Agent Basic',
    type: 'support',
    role: 'general',
    tier: 'starter',
    status: 'active',
    description: 'Basic customer support for common queries',
    capabilities: [
      { name: 'faq_answering', description: 'Answer frequently asked questions', enabled: true },
      { name: 'order_status', description: 'Check order status', enabled: true },
      { name: 'refund_info', description: 'Provide refund information', enabled: true },
      { name: 'complaint_logging', description: 'Log customer complaints', enabled: true },
    ],
    channels: ['chat', 'whatsapp'],
    languages: ['en', 'hi'],
    industries: ['ecommerce', 'retail', 'general'],
    pricing: { perConversation: 5, monthlySubscription: 5000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-support-pro',
    name: 'Support Agent Pro',
    type: 'support',
    role: 'general',
    tier: 'professional',
    status: 'active',
    description: 'Advanced customer support with CRM integration',
    capabilities: [
      { name: 'faq_answering', description: 'Answer frequently asked questions', enabled: true },
      { name: 'order_status', description: 'Check order status', enabled: true },
      { name: 'refund_processing', description: 'Process refunds', enabled: true },
      { name: 'complaint_resolution', description: 'Resolve complaints', enabled: true },
      { name: 'ticket_creation', description: 'Create support tickets', enabled: true },
      { name: 'crm_sync', description: 'Sync with CRM systems', enabled: true },
    ],
    channels: ['chat', 'whatsapp', 'email'],
    languages: ['en', 'hi', 'ta', 'te', 'bn'],
    industries: ['ecommerce', 'retail', 'banking', 'healthcare'],
    pricing: { perConversation: 10, monthlySubscription: 15000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-sales-sdr',
    name: 'Sales SDR Agent',
    type: 'sales',
    role: 'sdr',
    tier: 'professional',
    status: 'active',
    description: 'Sales Development Representative for lead qualification',
    capabilities: [
      { name: 'lead_qualification', description: 'Qualify sales leads', enabled: true },
      { name: 'product_explanation', description: 'Explain products/services', enabled: true },
      { name: 'demo_booking', description: 'Book product demos', enabled: true },
      { name: 'follow_up', description: 'Follow up with prospects', enabled: true },
      { name: 'crm_update', description: 'Update CRM records', enabled: true },
    ],
    channels: ['whatsapp', 'chat', 'voice', 'email'],
    languages: ['en', 'hi'],
    industries: ['ecommerce', 'saas', 'education', 'realestate'],
    pricing: { perConversation: 10, monthlySubscription: 20000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-voice-receptionist',
    name: 'AI Receptionist',
    type: 'voice',
    role: 'receptionist',
    tier: 'starter',
    status: 'active',
    description: 'Voice-powered receptionist for call handling',
    capabilities: [
      { name: 'call_answering', description: 'Answer incoming calls', enabled: true },
      { name: 'appointment_scheduling', description: 'Schedule appointments', enabled: true },
      { name: 'call_routing', description: 'Route calls appropriately', enabled: true },
      { name: 'voicemail', description: 'Take voicemails', enabled: true },
      { name: 'ivr_navigation', description: 'Navigate IVR menus', enabled: true },
    ],
    channels: ['voice'],
    languages: ['en', 'hi'],
    industries: ['healthcare', 'salon', 'restaurant', 'hotel', 'clinic'],
    pricing: { perMinute: 3, monthlySubscription: 10000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: { voice: 'female', greeting: 'Hello, thank you for calling' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-voice-collector',
    name: 'Collections Agent',
    type: 'voice',
    role: 'collector',
    tier: 'professional',
    status: 'active',
    description: 'AI agent for payment collections and reminders',
    capabilities: [
      { name: 'payment_reminder', description: 'Send payment reminders', enabled: true },
      { name: 'emi_followup', description: 'Follow up on EMI payments', enabled: true },
      { name: 'settlement_discussion', description: 'Discuss settlement options', enabled: true },
      { name: 'soft_collections', description: 'Handle soft collections', enabled: true },
      { name: 'promise_to_pay', description: 'Record promise to pay', enabled: true },
    ],
    channels: ['voice', 'whatsapp', 'sms'],
    languages: ['en', 'hi'],
    industries: ['banking', 'nbfc', 'fintech', 'lending'],
    pricing: { perMinute: 4, monthlySubscription: 25000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: { voice: 'female', template: 'collections' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-recruiter',
    name: 'HR Recruiter Agent',
    type: 'recruiter',
    role: 'general',
    tier: 'professional',
    status: 'active',
    description: 'AI agent for recruitment and candidate screening',
    capabilities: [
      { name: 'resume_screening', description: 'Screen resumes', enabled: true },
      { name: 'candidate_calls', description: 'Make candidate calls', enabled: true },
      { name: 'interview_scheduling', description: 'Schedule interviews', enabled: true },
      { name: 'candidate_scoring', description: 'Score candidates', enabled: true },
      { name: 'offer_communication', description: 'Communicate offers', enabled: true },
    ],
    channels: ['whatsapp', 'email', 'chat'],
    languages: ['en', 'hi'],
    industries: ['hr', 'recruitment', 'staffing'],
    pricing: { perTask: 50, monthlySubscription: 30000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-healthcare-coordinator',
    name: 'Healthcare Coordinator',
    type: 'specialist',
    role: 'general',
    tier: 'professional',
    status: 'active',
    description: 'AI coordinator for healthcare appointments and patient support',
    capabilities: [
      { name: 'appointment_booking', description: 'Book appointments', enabled: true },
      { name: 'followup_reminders', description: 'Send follow-up reminders', enabled: true },
      { name: 'prescription_reminders', description: 'Remind about prescriptions', enabled: true },
      { name: 'insurance_support', description: 'Insurance-related support', enabled: true },
      { name: 'lab_reports', description: 'Deliver lab reports', enabled: true },
    ],
    channels: ['whatsapp', 'chat', 'voice'],
    languages: ['en', 'hi'],
    industries: ['healthcare', 'hospital', 'clinic', 'pharmacy'],
    pricing: { perConversation: 8, monthlySubscription: 20000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'agent-travel-consultant',
    name: 'Travel Consultant',
    type: 'specialist',
    role: 'general',
    tier: 'professional',
    status: 'active',
    description: 'AI consultant for travel support and booking assistance',
    capabilities: [
      { name: 'flight_support', description: 'Flight-related support', enabled: true },
      { name: 'hotel_booking_support', description: 'Hotel booking help', enabled: true },
      { name: 'visa_support', description: 'Visa-related queries', enabled: true },
      { name: 'cancellation_processing', description: 'Process cancellations', enabled: true },
      { name: 'itinerary_management', description: 'Manage itineraries', enabled: true },
    ],
    channels: ['whatsapp', 'chat', 'email'],
    languages: ['en', 'hi'],
    industries: ['travel', 'airlines', 'hospitality'],
    pricing: { perConversation: 12, monthlySubscription: 25000 },
    metrics: {
      conversationsHandled: 0,
      tasksCompleted: 0,
      avgResponseTime: 0,
      satisfactionScore: 0,
      escalationRate: 0,
      successRate: 0,
      lastUpdated: new Date(),
    },
    config: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class AgentService {
  // Initialize default agents
  async initializeDefaultAgents(): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const existingCount = await collection.countDocuments();
    if (existingCount === 0) {
      await collection.insertMany(DEFAULT_AGENTS as Document[]);
      logger.info({ count: DEFAULT_AGENTS.length }, 'Default agents initialized');
    }
  }

  // Create a new agent
  async createAgent(data: {
    name: string;
    type: AgentType;
    role: AgentRole;
    tier?: AgentTier;
    description?: string;
    capabilities?: AgentCapability[];
    channels?: Agent['channels'];
    languages?: string[];
    industries?: string[];
    pricing?: Agent['pricing'];
  }): Promise<Agent> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const now = new Date();
    const agent: Agent = {
      id: `agent-${uuidv4().substring(0, 8)}`,
      name: data.name,
      type: data.type,
      role: data.role,
      tier: data.tier || 'starter',
      status: 'active',
      description: data.description || '',
      capabilities: data.capabilities || [],
      channels: data.channels || ['chat'],
      languages: data.languages || ['en'],
      industries: data.industries || [],
      pricing: data.pricing || {},
      metrics: {
        conversationsHandled: 0,
        tasksCompleted: 0,
        avgResponseTime: 0,
        satisfactionScore: 0,
        escalationRate: 0,
        successRate: 0,
        lastUpdated: now,
      },
      config: {},
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(agent as Document);
    logger.info({ agentId: agent.id, name: agent.name }, 'Agent created');

    return agent;
  }

  // Get agent by ID
  async getAgentById(id: string): Promise<Agent | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const agent = await collection.findOne({ id });
    return agent as Agent | null;
  }

  // List agents with filters
  async listAgents(filters?: {
    type?: AgentType;
    role?: AgentRole;
    tier?: AgentTier;
    status?: AgentStatus;
    industry?: string;
    language?: string;
    page?: number;
    limit?: number;
  }): Promise<{ agents: Agent[]; total: number; page: number; totalPages: number }> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = {};

    if (filters?.type) filter.type = filters.type;
    if (filters?.role) filter.role = filters.role;
    if (filters?.tier) filter.tier = filters.tier;
    if (filters?.status) filter.status = filters.status;
    if (filters?.industry) filter.industries = filters.industry;
    if (filters?.language) filter.languages = filters.language;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      collection.find(filter).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      agents: agents as Agent[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get agents by type
  async getAgentsByType(type: AgentType): Promise<Agent[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const agents = await collection
      .find({ type, status: 'active' })
      .toArray();

    return agents as Agent[];
  }

  // Get agents by industry
  async getAgentsByIndustry(industry: string): Promise<Agent[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const agents = await collection
      .find({ industries: industry, status: 'active' })
      .toArray();

    return agents as Agent[];
  }

  // Update agent
  async updateAgent(
    id: string,
    updates: Partial<Agent>
  ): Promise<Agent | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result as Agent | null;
  }

  // Update agent metrics
  async updateAgentMetrics(
    id: string,
    metrics: Partial<AgentMetrics>
  ): Promise<Agent | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id },
      {
        $set: {
          'metrics': { ...metrics, lastUpdated: new Date() },
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result as Agent | null;
  }

  // Delete agent
  async deleteAgent(id: string): Promise<boolean> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Deploy agent
  async deployAgent(id: string): Promise<Agent | null> {
    return this.updateAgent(id, { status: 'active' });
  }

  // Pause agent
  async pauseAgent(id: string): Promise<Agent | null> {
    return this.updateAgent(id, { status: 'maintenance' });
  }
}

export const agentService = new AgentService();

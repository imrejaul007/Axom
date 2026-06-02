import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { pino } from '../logger.js';
import type {
  BPOSubscription,
  BPOService,
  BPOServiceType,
  BPOSubscriptionTier,
  BPOSubscriptionStatus,
  BPOServiceConfig,
} from '../types/index.js';

const logger = pino.child({ module: 'SubscriptionService' });

const SUBSCRIPTION_COLLECTION = 'subscriptions';
const SERVICE_COLLECTION = 'services';

// Default BPO Services
const DEFAULT_SERVICES: Omit<BPOService, '_id'>[] = [
  {
    id: 'service-customer-support',
    type: 'customer_support',
    name: 'Customer Support BPO',
    description: 'AI-powered customer support for ecommerce, D2C brands, SaaS, and consumer apps',
    industries: ['ecommerce', 'saas', 'consumer', 'retail'],
    capabilities: [
      'Order status queries',
      'Refund requests',
      'Complaint handling',
      'Appointment booking',
      'FAQ answering',
      'Product information',
      'Returns/Exchange',
      'Cancellation requests',
    ],
    channels: ['WhatsApp', 'Website Chat', 'Mobile App', 'Email'],
    pricing: { setup: 50000, monthly: 25000 },
    features: ['AI Agent', 'Ticketing', 'CRM Integration', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-sales',
    type: 'sales',
    name: 'Sales BPO',
    description: 'AI SDR team for lead qualification, follow-ups, and demo bookings',
    industries: ['ecommerce', 'realestate', 'education', 'insurance', 'finance'],
    capabilities: [
      'Lead qualification',
      'Follow-up sequences',
      'Product explanation',
      'Demo booking',
      'Quotation generation',
      'Cross-sell/Upsell',
    ],
    channels: ['WhatsApp', 'Voice', 'Email'],
    pricing: { setup: 75000, monthly: 50000 },
    features: ['AI SDR', 'CRM Sync', 'Lead Scoring', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-telecalling',
    type: 'telecalling',
    name: 'Telecalling BPO',
    description: 'Voice agents for outbound sales, collections, and customer engagement',
    industries: ['banking', 'nbfc', 'insurance', 'realestate', 'education'],
    capabilities: [
      'Loan sales',
      'Insurance sales',
      'Property sales',
      'Course sales',
      'Event registrations',
      'Survey calls',
    ],
    channels: ['Voice'],
    pricing: { setup: 50000, monthly: 30000, perMinute: 3 },
    features: ['Voice AI', 'IVR', 'Call Recording', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-collections',
    type: 'collections',
    name: 'Collections BPO',
    description: 'AI agents for payment collections, EMI reminders, and soft collections',
    industries: ['banking', 'nbfc', 'fintech', 'lending'],
    capabilities: [
      'EMI reminders',
      'Payment follow-ups',
      'Settlement discussions',
      'Soft collections',
      'Promise to pay',
      'Legal escalation',
    ],
    channels: ['Voice', 'WhatsApp', 'SMS'],
    pricing: { setup: 100000, monthly: 75000, perMinute: 4 },
    features: ['Voice AI', 'Payment Integration', 'Legal Workflow', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-recruitment',
    type: 'recruitment',
    name: 'Recruitment BPO',
    description: 'AI agents for resume screening, candidate calls, and interview scheduling',
    industries: ['hr', 'recruitment', 'staffing', 'corporate'],
    capabilities: [
      'Resume screening',
      'Candidate outreach',
      'Interview scheduling',
      'Candidate scoring',
      'Offer communication',
      'Onboarding coordination',
    ],
    channels: ['WhatsApp', 'Email', 'Chat'],
    pricing: { setup: 25000, monthly: 15000, perTask: 50 },
    features: ['AI Screening', 'Calendar Integration', 'Scorecard', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-healthcare',
    type: 'healthcare',
    name: 'Healthcare BPO',
    description: 'AI coordinators for appointments, reminders, and patient support',
    industries: ['healthcare', 'hospital', 'clinic', 'pharmacy'],
    capabilities: [
      'Appointment booking',
      'Follow-up reminders',
      'Prescription reminders',
      'Insurance support',
      'Patient queries',
      'Lab report delivery',
    ],
    channels: ['WhatsApp', 'Chat', 'Voice'],
    pricing: { setup: 75000, monthly: 50000 },
    features: ['AI Coordinator', 'Calendar Sync', 'HIPAA Compliance', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-travel',
    type: 'travel',
    name: 'Travel BPO',
    description: 'AI consultants for flight support, hotel bookings, and itinerary management',
    industries: ['travel', 'airlines', 'hospitality', 'tourism'],
    capabilities: [
      'Flight support',
      'Visa support',
      'Hotel booking support',
      'Lounge support',
      'Itinerary management',
      'Cancellation processing',
    ],
    channels: ['WhatsApp', 'Chat', 'Email'],
    pricing: { setup: 50000, monthly: 35000 },
    features: ['AI Consultant', 'GDS Integration', 'Itinerary Builder', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'service-realestate',
    type: 'realestate',
    name: 'Real Estate BPO',
    description: 'AI agents for lead qualification, site visits, and property recommendations',
    industries: ['realestate', 'property', 'construction'],
    capabilities: [
      'Lead qualification',
      'Property recommendations',
      'Site visit booking',
      'Builder coordination',
      'Follow-up sequences',
      'Loan assistance',
    ],
    channels: ['WhatsApp', 'Chat', 'Voice'],
    pricing: { setup: 75000, monthly: 60000 },
    features: ['AI Agent', 'Property DB', 'Site Visit Scheduler', 'Analytics'],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class SubscriptionService {
  // Initialize default services
  async initializeDefaultServices(): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(SERVICE_COLLECTION);

    const existingCount = await collection.countDocuments();
    if (existingCount === 0) {
      await collection.insertMany(DEFAULT_SERVICES as Document[]);
      logger.info({ count: DEFAULT_SERVICES.length }, 'Default BPO services initialized');
    }
  }

  // Create a new subscription
  async createSubscription(data: {
    customerId: string;
    customerName: string;
    customerEmail: string;
    serviceType: BPOServiceType;
    tier?: BPOSubscriptionTier;
    agentIds?: string[];
    config?: BPOServiceConfig;
  }): Promise<BPOSubscription> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const now = new Date();
    const service = await this.getServiceByType(data.serviceType);

    const subscription: BPOSubscription = {
      id: `sub-${uuidv4().substring(0, 12)}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      serviceType: data.serviceType,
      tier: data.tier || 'starter',
      status: 'trial',
      agents: (data.agentIds || []).map((agentId) => ({
        agentId,
        agentName: agentId,
        quantity: 1,
        configured: false,
      })),
      config: data.config || {},
      billing: {
        setupFee: service?.pricing.setup || 0,
        monthlyFee: service?.pricing.monthly || 0,
        usageFees: 0,
        totalDue: service?.pricing.setup || 0,
        nextBillingDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
      integrations: [],
      startedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(subscription as Document);
    logger.info({ subscriptionId: subscription.id, serviceType: data.serviceType }, 'Subscription created');

    return subscription;
  }

  // Get subscription by ID
  async getSubscriptionById(id: string): Promise<BPOSubscription | null> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const subscription = await collection.findOne({ id });
    return subscription as BPOSubscription | null;
  }

  // Get subscriptions by customer
  async getSubscriptionsByCustomer(customerId: string): Promise<BPOSubscription[]> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const subscriptions = await collection
      .find({ customerId })
      .sort({ createdAt: -1 })
      .toArray();

    return subscriptions as BPOSubscription[];
  }

  // List all subscriptions
  async listSubscriptions(filters?: {
    serviceType?: BPOServiceType;
    status?: BPOSubscriptionStatus;
    tier?: BPOSubscriptionTier;
    page?: number;
    limit?: number;
  }): Promise<{
    subscriptions: BPOSubscription[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const filter: Record<string, unknown> = {};
    if (filters?.serviceType) filter.serviceType = filters.serviceType;
    if (filters?.status) filter.status = filters.status;
    if (filters?.tier) filter.tier = filters.tier;

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [subscriptions, total] = await Promise.all([
      collection.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      subscriptions: subscriptions as BPOSubscription[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Update subscription
  async updateSubscription(
    id: string,
    updates: Partial<BPOSubscription>
  ): Promise<BPOSubscription | null> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

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

    return result as BPOSubscription | null;
  }

  // Activate subscription
  async activateSubscription(id: string): Promise<BPOSubscription | null> {
    return this.updateSubscription(id, { status: 'active' });
  }

  // Pause subscription
  async pauseSubscription(id: string): Promise<BPOSubscription | null> {
    return this.updateSubscription(id, { status: 'paused' });
  }

  // Cancel subscription
  async cancelSubscription(id: string): Promise<BPOSubscription | null> {
    return this.updateSubscription(id, { status: 'cancelled' });
  }

  // Add agent to subscription
  async addAgentToSubscription(
    subscriptionId: string,
    agentId: string,
    agentName: string,
    quantity = 1
  ): Promise<BPOSubscription | null> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: subscriptionId },
      {
        $push: {
          agents: {
            agentId,
            agentName,
            quantity,
            configured: false,
          },
        },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    return result as BPOSubscription | null;
  }

  // Remove agent from subscription
  async removeAgentFromSubscription(
    subscriptionId: string,
    agentId: string
  ): Promise<BPOSubscription | null> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: subscriptionId },
      {
        $pull: { agents: { agentId } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    return result as BPOSubscription | null;
  }

  // Add integration
  async addIntegration(
    subscriptionId: string,
    integration: BPOSubscription['integrations'][0]
  ): Promise<BPOSubscription | null> {
    const db = getDatabase();
    const collection = db.collection(SUBSCRIPTION_COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: subscriptionId },
      {
        $push: { integrations: integration },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    return result as BPOSubscription | null;
  }

  // Get BPO Service
  async getServiceByType(type: BPOServiceType): Promise<BPOService | null> {
    const db = getDatabase();
    const collection = db.collection(SERVICE_COLLECTION);

    const service = await collection.findOne({ type, isActive: true });
    return service as BPOService | null;
  }

  // List available services
  async listServices(): Promise<BPOService[]> {
    const db = getDatabase();
    const collection = db.collection(SERVICE_COLLECTION);

    const services = await collection
      .find({ isActive: true })
      .toArray();

    return services as BPOService[];
  }
}

export const subscriptionService = new SubscriptionService();

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { config } from '../config/index.js';
import { pino } from '../logger.js';
import { brandService } from './brandService.js';
import type {
  Conversation,
  ConversationMessage,
  Brand,
  Ticket,
  TicketType,
  TicketPriority,
  EscalationLevel,
} from '../types/index.js';

const logger = pino.child({ module: 'ConciergeService' });

const COLLECTION = 'conversations';
const TICKET_COLLECTION = 'tickets';

interface ConciergeContext {
  brandId?: string;
  brandName?: string;
  intent?: string;
  entities?: Record<string, string>;
  sentiment?: 'positive' | 'neutral' | 'negative';
  confidence?: number;
  suggestedActions?: string[];
  requiresHuman?: boolean;
  suggestedTicketType?: TicketType;
  suggestedPriority?: TicketPriority;
}

interface ConciergeResponse {
  message: string;
  suggestions?: string[];
  actions?: {
    type: 'quick_reply' | 'button' | 'link' | 'ticket';
    label: string;
    value?: string;
    url?: string;
  }[];
  context: ConciergeContext;
  escalate?: boolean;
  createTicket?: boolean;
}

// AI Concierge - Handles customer conversations
export class ConciergeService {
  private readonly MAX_CONTEXT_MESSAGES = 10;

  // Main conversation handler
  async processMessage(
    customerId: string,
    message: string,
    channel: 'whatsapp' | 'chat' | 'voice' | 'email' | 'app',
    context?: Partial<ConciergeContext>
  ): Promise<ConciergeResponse> {
    logger.info({ customerId, channel, messageLength: message.length }, 'Processing message');

    // Detect intent and entities
    const intentResult = await this.detectIntent(message, context?.brandId);

    // Get conversation history
    const conversation = await this.getOrCreateConversation(customerId, context?.brandId, channel);

    // Add user message to history
    await this.addMessageToConversation(conversation.id, {
      role: 'user',
      content: message,
    });

    // Generate response
    const response = await this.generateResponse(
      message,
      intentResult,
      conversation,
      context
    );

    // Add assistant message to history
    await this.addMessageToConversation(conversation.id, {
      role: 'assistant',
      content: response.message,
    });

    // Update conversation context
    await this.updateConversationContext(conversation.id, intentResult);

    return response;
  }

  // Detect intent and extract entities
  private async detectIntent(
    message: string,
    brandId?: string
  ): Promise<ConciergeContext> {
    const lowerMessage = message.toLowerCase();

    // Intent patterns
    const intents = {
      order_status: ['where is my order', 'order status', 'track order', 'order tracking', 'delivery status'],
      refund: ['refund', 'money back', 'return', 'cancel order', 'return my'],
      complaint: ['complaint', 'not happy', 'worst', 'terrible', 'issue', 'problem', 'broken', 'damaged'],
      booking: ['booking', 'appointment', 'schedule', 'reserve', 'reschedule'],
      warranty: ['warranty', 'guarantee', 'service center', 'repair', 'fix'],
      sales: ['buy', 'purchase', 'price', 'cost', 'how much', 'available'],
      feedback: ['feedback', 'suggestion', 'improve', 'recommend'],
      general: ['help', 'support', 'contact', 'talk to someone'],
    };

    let detectedIntent = 'general';
    for (const [intent, patterns] of Object.entries(intents)) {
      if (patterns.some((pattern) => lowerMessage.includes(pattern))) {
        detectedIntent = intent;
        break;
      }
    }

    // Extract entities
    const entities: Record<string, string> = {};

    // Order ID pattern
    const orderIdMatch = message.match(/order[:#\s]*([A-Z0-9-]{5,})/i);
    if (orderIdMatch) {
      entities.orderId = orderIdMatch[1];
    }

    // Phone number pattern
    const phoneMatch = message.match(/(\+?91[-.\s]?\d{10})/);
    if (phoneMatch) {
      entities.phone = phoneMatch[1];
    }

    // Email pattern
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      entities.email = emailMatch[1];
    }

    // Sentiment analysis (simple keyword-based)
    const negativeWords = ['angry', 'frustrated', 'terrible', 'worst', 'horrible', 'hate', 'disappointed'];
    const positiveWords = ['thank', 'great', 'excellent', 'amazing', 'love', 'happy', 'appreciate'];

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (negativeWords.some((w) => lowerMessage.includes(w))) {
      sentiment = 'negative';
    } else if (positiveWords.some((w) => lowerMessage.includes(w))) {
      sentiment = 'positive';
    }

    // Determine escalation need
    const requiresHuman =
      sentiment === 'negative' ||
      detectedIntent === 'complaint' ||
      message.length > 500;

    // Suggest ticket type based on intent
    const intentToTicketType: Record<string, TicketType> = {
      order_status: 'support',
      refund: 'refund',
      complaint: 'complaint',
      booking: 'booking',
      warranty: 'warranty',
      sales: 'sales',
      feedback: 'feedback',
      general: 'support',
    };

    // Determine priority
    let priority: TicketPriority = 'medium';
    if (sentiment === 'negative' || message.includes('urgent')) {
      priority = 'high';
    }
    if (message.includes('emergency') || message.includes('asap')) {
      priority = 'urgent';
    }

    return {
      intent: detectedIntent,
      entities,
      sentiment,
      confidence: 0.8,
      requiresHuman,
      suggestedTicketType: intentToTicketType[detectedIntent],
      suggestedPriority: priority,
      brandId,
    };
  }

  // Generate AI response
  private async generateResponse(
    message: string,
    intentResult: ConciergeContext,
    conversation: Conversation,
    context?: Partial<ConciergeContext>
  ): Promise<ConciergeResponse> {
    const { intent, entities, sentiment, requiresHuman } = intentResult;

    // Get brand info if available
    let brandName = context?.brandName;
    if (intentResult.brandId) {
      const brand = await brandService.getBrandById(intentResult.brandId);
      if (brand) {
        brandName = brand.name;
      }
    }

    // Response templates
    const responses: Record<string, { message: string; suggestions: string[] }> = {
      order_status: {
        message: brandName
          ? `I can help you check your order status${brandName ? ` from ${brandName}` : ''}. Could you please provide your order ID?`
          : `I can help you check your order status. Could you please provide your order ID or the brand/store name?`,
        suggestions: ['Track my order', 'I need help finding my order', 'Talk to support'],
      },
      refund: {
        message: brandName
          ? `I understand you'd like a refund from ${brandName}. Let me help you with that. Could you provide your order ID and reason for the refund?`
          : `I understand you'd like a refund. Could you provide more details about your order and the reason for the refund?`,
        suggestions: ['Request refund', 'Cancel order', 'Return process', 'Talk to support'],
      },
      complaint: {
        message: `I'm truly sorry to hear about your experience. Let me help you resolve this. Could you please share more details about the issue?`,
        suggestions: ['File a complaint', 'Get help now', 'Talk to human'],
      },
      booking: {
        message: brandName
          ? `I can help you with booking at ${brandName}. What type of appointment are you looking for?`
          : `I'd be happy to help you with a booking. Could you tell me which service or establishment you're looking to book at?`,
        suggestions: ['Book appointment', 'Check availability', 'View services'],
      },
      warranty: {
        message: `I can help you with warranty and service-related queries. Do you have your product details or warranty information handy?`,
        suggestions: ['Check warranty', 'Find service center', 'Book service'],
      },
      sales: {
        message: brandName
          ? `Great! You're interested in ${brandName}. How can I help you with your purchase?`
          : `I'd be happy to help you with your purchase. Could you tell me what you're looking for?`,
        suggestions: ['View products', 'Check price', 'Find nearest store'],
      },
      feedback: {
        message: `Thank you for your feedback! We value your input. What would you like to share with us?`,
        suggestions: ['Submit feedback', 'Rate experience', 'Give suggestion'],
      },
      general: {
        message: `Hello! I'm Axomi Help, your universal support assistant. How can I help you today?`,
        suggestions: ['Track order', 'Request refund', 'Book appointment', 'File complaint', 'Contact support'],
      },
    };

    const template = responses[intent] || responses.general;

    // If we have an order ID, try to provide immediate help
    if (entities.orderId) {
      return {
        message: `I found your order ${entities.orderId}. Let me check the status for you. In the meantime, is there anything specific you'd like to know?`,
        suggestions: ['Check status', 'Track delivery', 'Request changes'],
        context: intentResult,
        createTicket: requiresHuman,
      };
    }

    return {
      message: template.message,
      suggestions: template.suggestions,
      context: intentResult,
      escalate: requiresHuman,
      createTicket: requiresHuman && sentiment === 'negative',
    };
  }

  // Get or create conversation
  async getOrCreateConversation(
    customerId: string,
    brandId?: string,
    channel: Conversation['channel'] = 'chat'
  ): Promise<Conversation> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    // Check for existing active conversation
    const existing = await collection.findOne({
      customerId,
      brandId,
      status: 'active',
    });

    if (existing) {
      return existing as Conversation;
    }

    // Create new conversation
    const conversation: Conversation = {
      id: uuidv4(),
      customerId,
      brandId,
      channel,
      messages: [],
      context: {},
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(conversation as Document);
    logger.info({ conversationId: conversation.id, customerId }, 'New conversation created');

    return conversation;
  }

  // Add message to conversation
  async addMessageToConversation(
    conversationId: string,
    message: Omit<ConversationMessage, 'id' | 'createdAt'>
  ): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const fullMessage: ConversationMessage = {
      ...message,
      id: uuidv4(),
      createdAt: new Date(),
    };

    await collection.updateOne(
      { id: conversationId },
      {
        $push: {
          messages: {
            $each: [fullMessage],
            $slice: -this.MAX_CONTEXT_MESSAGES, // Keep last N messages
          },
        },
        $set: { updatedAt: new Date() },
      }
    );
  }

  // Update conversation context
  async updateConversationContext(
    conversationId: string,
    context: Partial<ConciergeContext>
  ): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    await collection.updateOne(
      { id: conversationId },
      {
        $set: {
          context: context as Conversation['context'],
          updatedAt: new Date(),
        },
      }
    );
  }

  // Resolve conversation
  async resolveConversation(conversationId: string): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    await collection.updateOne(
      { id: conversationId },
      {
        $set: {
          status: 'resolved',
          updatedAt: new Date(),
        },
      }
    );
  }

  // Escalate conversation
  async escalateConversation(conversationId: string): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    await collection.updateOne(
      { id: conversationId },
      {
        $set: {
          status: 'escalated',
          updatedAt: new Date(),
        },
      }
    );
  }

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<Conversation | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const conversation = await collection.findOne({ id: conversationId });
    return conversation as Conversation | null;
  }

  // Get customer conversations
  async getCustomerConversations(
    customerId: string,
    status?: Conversation['status']
  ): Promise<Conversation[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = { customerId };
    if (status) {
      filter.status = status;
    }

    const conversations = await collection
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();

    return conversations as Conversation[];
  }
}

export const conciergeService = new ConciergeService();

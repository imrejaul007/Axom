import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './database.js';
import { pino } from '../logger.js';
import type {
  Ticket,
  TicketType,
  TicketStatus,
  TicketPriority,
  EscalationLevel,
  TicketContext,
  TicketMessage,
  Resolution,
  TicketSearchQuery,
} from '../types/index.js';

const logger = pino.child({ module: 'TicketService' });

const COLLECTION = 'tickets';

// Ticket counter for ticket numbers
let ticketCounter = 0;

export class TicketService {
  // Generate ticket number
  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    ticketCounter++;
    return `AXH-${dateStr}-${String(ticketCounter).padStart(4, '0')}`;
  }

  // Create a new ticket
  async createTicket(data: {
    customerId: string;
    customerName: string;
    customerEmail?: string;
    brandId: string;
    brandName: string;
    type: TicketType;
    subject: string;
    description: string;
    context?: Partial<TicketContext>;
    priority?: TicketPriority;
    source?: 'whatsapp' | 'chat' | 'voice' | 'email' | 'app' | 'widget';
    tags?: string[];
  }): Promise<Ticket> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const now = new Date();
    const ticketNumber = await this.generateTicketNumber();

    const ticket: Ticket = {
      id: uuidv4(),
      ticketNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      brandId: data.brandId,
      brandName: data.brandName,
      type: data.type,
      status: 'open',
      priority: data.priority || 'medium',
      currentLevel: 1,
      subject: data.subject,
      description: data.description,
      context: {
        previousTickets: 0,
        ...data.context,
      },
      messages: [
        {
          id: uuidv4(),
          senderId: data.customerId,
          senderType: 'customer',
          content: data.description,
          createdAt: now,
        },
      ],
      source: data.source || 'chat',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(ticket as Document);
    logger.info({ ticketId: ticket.id, ticketNumber, brandId: data.brandId }, 'Ticket created');

    // Emit event for analytics
    await this.emitTicketEvent('created', ticket);

    return ticket;
  }

  // Get ticket by ID
  async getTicketById(id: string): Promise<Ticket | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const ticket = await collection.findOne({ id });
    return ticket as Ticket | null;
  }

  // Get ticket by ticket number
  async getTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const ticket = await collection.findOne({ ticketNumber });
    return ticket as Ticket | null;
  }

  // Search tickets
  async searchTickets(query: TicketSearchQuery): Promise<{
    tickets: Ticket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = {};

    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.brandId) {
      filter.brandId = query.brandId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.assignedTo) {
      filter.assignedTo = query.assignedTo;
    }
    if (query.dateFrom || query.dateTo) {
      filter.createdAt = {};
      if (query.dateFrom) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(query.dateTo);
      }
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      collection.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      tickets: tickets as Ticket[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Update ticket
  async updateTicket(
    id: string,
    updates: Partial<Pick<Ticket, 'status' | 'priority' | 'assignedTo' | 'assignedToName' | 'currentLevel' | 'tags'>>
  ): Promise<Ticket | null> {
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

    if (result) {
      await this.emitTicketEvent('updated', result as Ticket);
    }

    return result as Ticket | null;
  }

  // Add message to ticket
  async addMessage(
    ticketId: string,
    message: Omit<TicketMessage, 'id' | 'createdAt'>
  ): Promise<TicketMessage | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const fullMessage: TicketMessage = {
      ...message,
      id: uuidv4(),
      createdAt: new Date(),
    };

    await collection.updateOne(
      { id: ticketId },
      {
        $push: { messages: fullMessage },
        $set: { updatedAt: new Date() },
      }
    );

    return fullMessage;
  }

  // Escalate ticket
  async escalateTicket(
    ticketId: string,
    level: EscalationLevel,
    reason?: string
  ): Promise<Ticket | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: ticketId },
      {
        $set: {
          status: 'escalated',
          currentLevel: level,
          updatedAt: new Date(),
        },
        $push: {
          messages: {
            id: uuidv4(),
            senderId: 'system',
            senderType: 'system',
            content: `Ticket escalated to Level ${level}${reason ? `: ${reason}` : ''}`,
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (result) {
      await this.emitTicketEvent('escalated', result as Ticket);
    }

    return result as Ticket | null;
  }

  // Resolve ticket
  async resolveTicket(
    ticketId: string,
    resolution: {
      solution: string;
      resolvedBy: 'ai' | 'agent';
      resolvedById?: string;
    }
  ): Promise<Ticket | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: ticketId },
      {
        $set: {
          status: 'resolved',
          resolution: {
            ...resolution,
            resolvedAt: new Date(),
          },
          resolvedAt: new Date(),
          updatedAt: new Date(),
        },
        $push: {
          messages: {
            id: uuidv4(),
            senderId: 'system',
            senderType: 'system',
            content: `Ticket resolved: ${resolution.solution}`,
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );

    if (result) {
      await this.emitTicketEvent('resolved', result as Ticket);
    }

    return result as Ticket | null;
  }

  // Close ticket
  async closeTicket(ticketId: string, feedback?: { rating: number; comment?: string }): Promise<Ticket | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const updateData: Record<string, unknown> = {
      status: 'closed',
      closedAt: new Date(),
      updatedAt: new Date(),
    };

    if (feedback) {
      updateData['resolution.feedback'] = feedback;
    }

    const result = await collection.findOneAndUpdate(
      { id: ticketId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (result) {
      await this.emitTicketEvent('closed', result as Ticket);
    }

    return result as Ticket | null;
  }

  // Assign ticket
  async assignTicket(
    ticketId: string,
    assignedTo: string,
    assignedToName: string
  ): Promise<Ticket | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: ticketId },
      {
        $set: {
          assignedTo,
          assignedToName,
          status: 'in_progress',
          updatedAt: new Date(),
        },
        $push: {
          messages: {
            id: uuidv4(),
            senderId: 'system',
            senderType: 'system',
            content: `Ticket assigned to ${assignedToName}`,
            createdAt: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );

    return result as Ticket | null;
  }

  // Get tickets by customer
  async getTicketsByCustomer(customerId: string): Promise<Ticket[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const tickets = await collection
      .find({ customerId })
      .sort({ createdAt: -1 })
      .toArray();

    return tickets as Ticket[];
  }

  // Get tickets by brand
  async getTicketsByBrand(brandId: string, status?: TicketStatus): Promise<Ticket[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = { brandId };
    if (status) {
      filter.status = status;
    }

    const tickets = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return tickets as Ticket[];
  }

  // Get open tickets for agent
  async getOpenTicketsForAgent(assignedTo?: string): Promise<Ticket[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = {
      status: { $in: ['open', 'escalated', 'in_progress'] },
    };

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const tickets = await collection
      .find(filter)
      .sort({ priority: -1, createdAt: 1 })
      .toArray();

    return tickets as Ticket[];
  }

  // Get ticket statistics
  async getTicketStats(brandId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    escalated: number;
    avgResolutionTime: number;
  }> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = {};
    if (brandId) {
      filter.brandId = brandId;
    }

    const tickets = await collection.find(filter).toArray();
    const ticketDocs = tickets as Ticket[];

    const total = ticketDocs.length;
    const open = ticketDocs.filter((t) => t.status === 'open').length;
    const inProgress = ticketDocs.filter((t) => t.status === 'in_progress').length;
    const resolved = ticketDocs.filter((t) => t.status === 'resolved').length;
    const closed = ticketDocs.filter((t) => t.status === 'closed').length;
    const escalated = ticketDocs.filter((t) => t.status === 'escalated').length;

    // Calculate average resolution time
    const resolvedTickets = ticketDocs.filter((t) => t.resolvedAt);
    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const resolved = new Date(t.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      avgResolutionTime = totalTime / resolvedTickets.length / 1000 / 60; // in minutes
    }

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      escalated,
      avgResolutionTime,
    };
  }

  // Emit ticket event (for analytics)
  private async emitTicketEvent(event: string, ticket: Ticket): Promise<void> {
    // In production, this would publish to event bus
    logger.debug({ event, ticketId: ticket.id, brandId: ticket.brandId }, 'Ticket event emitted');
  }
}

export const ticketService = new TicketService();

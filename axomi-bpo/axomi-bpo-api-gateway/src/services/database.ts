import { MongoClient, Db } from 'mongodb';
import { config } from '../config/index.js';
import { pino } from '../logger.js';

const logger = pino.child({ module: 'Database' });

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDatabase(): Promise<Db> {
  if (db) return db;

  try {
    client = new MongoClient(config.MONGODB_URI);
    await client.connect();
    db = client.db(config.MONGODB_DB_NAME);

    logger.info({ db: config.MONGODB_DB_NAME }, 'Connected to MongoDB');

    // Create indexes
    await createIndexes(db);

    return db;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
}

async function createIndexes(database: Db): Promise<void> {
  const collections = {
    agents: [
      { key: { id: 1 }, unique: true },
      { key: { type: 1, status: 1 } },
      { key: { tier: 1 } },
      { key: { industries: 1 } },
      { key: { languages: 1 } },
    ],
    subscriptions: [
      { key: { id: 1 }, unique: true },
      { key: { customerId: 1 } },
      { key: { serviceType: 1, status: 1 } },
      { key: { status: 1 } },
    ],
    conversations: [
      { key: { id: 1 }, unique: true },
      { key: { subscriptionId: 1 } },
      { key: { customerId: 1 } },
      { key: { status: 1 } },
      { key: { assignedAgentId: 1 } },
      { key: { createdAt: -1 } },
    ],
    tasks: [
      { key: { id: 1 }, unique: true },
      { key: { subscriptionId: 1 } },
      { key: { type: 1, status: 1 } },
      { key: { assignedAgentId: 1 } },
      { key: { createdAt: -1 } },
    ],
    queue: [
      { key: { id: 1 }, unique: true },
      { key: { subscriptionId: 1 } },
      { key: { priority: 1, createdAt: 1 } },
    ],
    departments: [
      { key: { id: 1 }, unique: true },
      { key: { customerId: 1 } },
    ],
    enterprises: [
      { key: { id: 1 }, unique: true },
      { key: { name: 1 } },
      { key: { status: 1 } },
    ],
    callLogs: [
      { key: { id: 1 }, unique: true },
      { key: { subscriptionId: 1 } },
      { key: { customerPhone: 1 } },
      { key: { createdAt: -1 } },
    ],
    services: [
      { key: { id: 1 }, unique: true },
      { key: { type: 1 } },
      { key: { isActive: 1 } },
    ],
  };

  for (const [collectionName, indexes] of Object.entries(collections)) {
    try {
      await database.collection(collectionName).createIndexes(indexes as object[]);
      logger.debug({ collection: collectionName }, 'Indexes created');
    } catch (error) {
      logger.warn({ collection: collectionName, error }, 'Failed to create some indexes');
    }
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB connection closed');
  }
}

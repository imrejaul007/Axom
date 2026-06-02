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
    brands: [
      { key: { slug: 1 }, unique: true },
      { key: { name: 'text', description: 'text' } },
      { key: { category: 1, tier: 1 } },
      { key: { trustScore: -1 } },
    ],
    tickets: [
      { key: { ticketNumber: 1 }, unique: true },
      { key: { customerId: 1 } },
      { key: { brandId: 1 } },
      { key: { status: 1 } },
      { key: { priority: 1 } },
      { key: { createdAt: -1 } },
      { key: { assignedTo: 1 } },
    ],
    customers: [
      { key: { email: 1 }, sparse: true },
      { key: { phone: 1 } },
      { key: { corpId: 1 }, sparse: true },
      { key: { trustScore: -1 } },
    ],
    conversations: [
      { key: { customerId: 1 } },
      { key: { brandId: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
    ],
    kbArticles: [
      { key: { slug: 1 }, unique: true },
      { key: { brandId: 1, category: 1 } },
      { key: { tags: 1 } },
      { key: { status: 1 } },
      { key: { views: -1 } },
    ],
    communityPosts: [
      { key: { brandId: 1 } },
      { key: { authorId: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
      { key: { tags: 1 } },
    ],
    escalationRules: [
      { key: { brandId: 1, level: 1 } },
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

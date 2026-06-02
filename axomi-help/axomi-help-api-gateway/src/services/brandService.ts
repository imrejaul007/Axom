import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import { getDatabase } from './database.js';
import { pino } from '../logger.js';
import type {
  Brand,
  BrandCategory,
  BrandTier,
  BrandIntegration,
  BrandSearchQuery,
} from '../types/index.js';

const logger = pino.child({ module: 'BrandService' });

const COLLECTION = 'brands';

// Brand Service
export class BrandService {
  // Create a new brand
  async createBrand(data: {
    name: string;
    category: BrandCategory;
    slug?: string;
    description?: string;
    logo?: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    tier?: BrandTier;
    supportLanguages?: string[];
  }): Promise<Brand> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const slug = data.slug || this.generateSlug(data.name);
    const now = new Date();

    const brand: Brand = {
      id: uuidv4(),
      slug,
      name: data.name,
      category: data.category,
      tier: data.tier || 'partner',
      description: data.description,
      logo: data.logo,
      website: data.website,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      supportLanguages: data.supportLanguages || ['en'],
      integrations: [],
      trustScore: 100,
      ticketVolume: 0,
      resolutionRate: 0,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(brand as Document);
    logger.info({ brandId: brand.id, name: brand.name }, 'Brand created');

    return brand;
  }

  // Get brand by ID
  async getBrandById(id: string): Promise<Brand | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const brand = await collection.findOne({ id });
    return brand as Brand | null;
  }

  // Get brand by slug
  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const brand = await collection.findOne({ slug });
    return brand as Brand | null;
  }

  // Search brands
  async searchBrands(query: BrandSearchQuery): Promise<{
    brands: Brand[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const filter: Record<string, unknown> = {};

    if (query.q) {
      filter.$text = { $search: query.q };
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.tier) {
      filter.tier = query.tier;
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [brands, total] = await Promise.all([
      collection.find(filter).skip(skip).limit(limit).sort({ trustScore: -1 }).toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      brands: brands as Brand[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Update brand
  async updateBrand(id: string, updates: Partial<Brand>): Promise<Brand | null> {
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

    return result as Brand | null;
  }

  // Add integration to brand
  async addIntegration(
    brandId: string,
    integration: BrandIntegration
  ): Promise<Brand | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: brandId },
      {
        $push: { integrations: integration },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    return result as Brand | null;
  }

  // Update integration status
  async updateIntegrationStatus(
    brandId: string,
    type: string,
    status: BrandIntegration['status']
  ): Promise<Brand | null> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.findOneAndUpdate(
      { id: brandId, 'integrations.type': type },
      {
        $set: {
          'integrations.$.status': status,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result as Brand | null;
  }

  // Delete brand
  async deleteBrand(id: string): Promise<boolean> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const result = await collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  // Get brands by category
  async getBrandsByCategory(category: BrandCategory): Promise<Brand[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const brands = await collection
      .find({ category })
      .sort({ trustScore: -1 })
      .toArray();

    return brands as Brand[];
  }

  // Get popular brands
  async getPopularBrands(limit = 10): Promise<Brand[]> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const brands = await collection
      .find({})
      .sort({ ticketVolume: -1, trustScore: -1 })
      .limit(limit)
      .toArray();

    return brands as Brand[];
  }

  // Update brand analytics
  async updateBrandAnalytics(
    brandId: string,
    metrics: { ticketVolume?: number; resolutionRate?: number; trustScore?: number }
  ): Promise<void> {
    const db = getDatabase();
    const collection = db.collection(COLLECTION);

    const updates: Record<string, number> = {};
    if (metrics.ticketVolume !== undefined) {
      updates['ticketVolume'] = metrics.ticketVolume;
    }
    if (metrics.resolutionRate !== undefined) {
      updates['resolutionRate'] = metrics.resolutionRate;
    }
    if (metrics.trustScore !== undefined) {
      updates['trustScore'] = metrics.trustScore;
    }

    if (Object.keys(updates).length > 0) {
      await collection.updateOne({ id: brandId }, { $set: updates });
    }
  }

  // Verify brand
  async verifyBrand(id: string): Promise<Brand | null> {
    return this.updateBrand(id, { tier: 'enterprise' });
  }

  // Helper: Generate slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}

export const brandService = new BrandService();

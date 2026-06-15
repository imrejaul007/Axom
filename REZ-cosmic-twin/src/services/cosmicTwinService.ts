import { randomUUID } from "node:crypto";
import {
  TwinModel,
  TwinStatus,
  TwinCapability,
  TwinSync,
  TwinUpdate,
  TWIN_SCHEMA_VERSION,
  INITIAL_LEARNING_PROGRESS,
  INITIAL_DATA_POINTS,
} from "../types.js";

/**
 * Service for managing digital twin lifecycle operations.
 *
 * Provides CRUD operations, capability management, sync tracking,
 * and learning progress monitoring for digital twins.
 *
 * Uses in-memory storage by default; swap {@link TwinStorage} for
 * a MongoDB/Redis adapter in production.
 */
export class CosmicTwinService {
  private readonly twins: Map<string, TwinModel> = new Map();
  private readonly syncHistory: Map<string, TwinSync[]> = new Map();

  /**
   * Creates a new digital twin for the given user.
   *
   * @param userId - The user or entity ID to create a twin for.
   * @param name - Human-readable display name.
   * @param description - Brief description of the twin's purpose.
   * @returns The newly created {@link TwinModel}.
   */
  async create(
    userId: string,
    name: string,
    description: string
  ): Promise<TwinModel> {
    const now = new Date().toISOString();
    const twin: TwinModel = {
      id: randomUUID(),
      userId,
      name,
      description,
      status: TwinStatus.CREATING,
      createdAt: now,
      updatedAt: now,
      lastSync: now,
      learningProgress: INITIAL_LEARNING_PROGRESS,
      capabilities: [],
      dataPoints: INITIAL_DATA_POINTS,
      version: TWIN_SCHEMA_VERSION,
    };

    this.twins.set(twin.id, twin);
    this.syncHistory.set(twin.id, []);

    // Simulate async creation transition to ACTIVE
    setTimeout(() => {
      this.updateStatus(twin.id, TwinStatus.ACTIVE);
    }, 100);

    return twin;
  }

  /**
   * Retrieves a twin by its unique ID.
   *
   * @param twinId - The twin's UUID.
   * @returns The twin model, or null if not found.
   */
  async get(twinId: string): Promise<TwinModel | null> {
    return this.twins.get(twinId) ?? null;
  }

  /**
   * Retrieves the twin associated with a user ID.
   *
   * @param userId - The user or entity ID.
   * @returns The twin model, or null if none exists for this user.
   */
  async getByUserId(userId: string): Promise<TwinModel | null> {
    for (const twin of this.twins.values()) {
      if (twin.userId === userId) {
        return twin;
      }
    }
    return null;
  }

  /**
   * Updates mutable properties of an existing twin.
   *
   * @param twinId - The twin's UUID.
   * @param updates - Partial update payload.
   * @returns The updated twin model.
   * @throws Error if twin does not exist.
   */
  async update(twinId: string, updates: TwinUpdate): Promise<TwinModel> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin with ID "${twinId}" not found`);
    }

    const updated: TwinModel = {
      ...twin,
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && {
        description: updates.description,
      }),
      ...(updates.personality !== undefined && {
        personality: updates.personality,
      }),
      ...(updates.capabilities !== undefined && {
        capabilities: updates.capabilities,
      }),
      updatedAt: new Date().toISOString(),
    };

    this.twins.set(twinId, updated);
    return updated;
  }

  /**
   * Synchronizes data into the twin and creates a sync record.
   *
   * @param twinId - The twin's UUID.
   * @param data - Arbitrary payload to sync (behavior, preferences, etc.).
   * @returns The created {@link TwinSync} record.
   * @throws Error if twin does not exist.
   */
  async sync(twinId: string, data: unknown): Promise<TwinSync> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin with ID "${twinId}" not found`);
    }

    const syncRecord: TwinSync = {
      id: randomUUID(),
      twinId,
      type: this.inferSyncType(data),
      data,
      syncedAt: new Date().toISOString(),
    };

    const history = this.syncHistory.get(twinId) ?? [];
    history.push(syncRecord);
    this.syncHistory.set(twinId, history);

    // Update twin data points and learning progress
    const updated: TwinModel = {
      ...twin,
      dataPoints: twin.dataPoints + 1,
      learningProgress: Math.min(100, twin.learningProgress + 5),
      lastSync: syncRecord.syncedAt,
      status: TwinStatus.LEARNING,
      updatedAt: syncRecord.syncedAt,
    };
    this.twins.set(twinId, updated);

    // Transition back to ACTIVE after sync
    setTimeout(() => {
      this.updateStatus(twinId, TwinStatus.ACTIVE);
    }, 50);

    return syncRecord;
  }

  /**
   * Adds a capability to the twin's capability list.
   *
   * @param twinId - The twin's UUID.
   * @param capability - The capability to add.
   * @returns The updated twin model.
   * @throws Error if twin does not exist.
   */
  async addCapability(
    twinId: string,
    capability: TwinCapability
  ): Promise<TwinModel> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin with ID "${twinId}" not found`);
    }

    if (twin.capabilities.includes(capability)) {
      return twin; // Already has this capability
    }

    const updated: TwinModel = {
      ...twin,
      capabilities: [...twin.capabilities, capability],
      updatedAt: new Date().toISOString(),
    };

    this.twins.set(twinId, updated);
    return updated;
  }

  /**
   * Retrieves the full sync history for a twin.
   *
   * @param twinId - The twin's UUID.
   * @returns Array of sync records, oldest first.
   */
  async getSyncHistory(twinId: string): Promise<TwinSync[]> {
    return this.syncHistory.get(twinId) ?? [];
  }

  /**
   * Retrieves all twins with the given status.
   *
   * @param status - The status filter to apply.
   * @returns Array of matching twin models.
   */
  async getByStatus(status: TwinStatus): Promise<TwinModel[]> {
    const results: TwinModel[] = [];
    for (const twin of this.twins.values()) {
      if (twin.status === status) {
        results.push(twin);
      }
    }
    return results;
  }

  /**
   * Permanently deletes a twin and its sync history.
   *
   * @param twinId - The twin's UUID.
   * @returns True if deletion succeeded, false if twin was not found.
   */
  async delete(twinId: string): Promise<boolean> {
    const existed = this.twins.delete(twinId);
    this.syncHistory.delete(twinId);
    return existed;
  }

  /**
   * Returns the current learning progress percentage (0-100).
   *
   * @param twinId - The twin's UUID.
   * @returns Learning progress as a number.
   * @throws Error if twin does not exist.
   */
  async getLearningProgress(twinId: string): Promise<number> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Twin with ID "${twinId}" not found`);
    }
    return twin.learningProgress;
  }

  /**
   * Updates the status of a twin.
   *
   * @param twinId - The twin's UUID.
   * @param status - The new status.
   */
  private updateStatus(twinId: string, status: TwinStatus): void {
    const twin = this.twins.get(twinId);
    if (twin) {
      this.twins.set(twinId, {
        ...twin,
        status,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Infers a sync type string from the data payload structure.
   *
   * @param data - The sync payload.
   * @returns A type label string.
   */
  private inferSyncType(data: unknown): string {
    if (data && typeof data === "object") {
      if ("event" in (data as Record<string, unknown>)) return "event";
      if ("preference" in (data as Record<string, unknown>)) return "preference";
      if ("behavior" in (data as Record<string, unknown>)) return "behavior";
    }
    return "generic";
  }
}

/** Shared singleton instance for use across the application. */
export const cosmicTwinService = new CosmicTwinService();

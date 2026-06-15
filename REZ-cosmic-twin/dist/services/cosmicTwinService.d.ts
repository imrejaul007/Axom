import { TwinModel, TwinStatus, TwinCapability, TwinSync, TwinUpdate } from "../types.js";
/**
 * Service for managing digital twin lifecycle operations.
 *
 * Provides CRUD operations, capability management, sync tracking,
 * and learning progress monitoring for digital twins.
 *
 * Uses in-memory storage by default; swap {@link TwinStorage} for
 * a MongoDB/Redis adapter in production.
 */
export declare class CosmicTwinService {
    private readonly twins;
    private readonly syncHistory;
    /**
     * Creates a new digital twin for the given user.
     *
     * @param userId - The user or entity ID to create a twin for.
     * @param name - Human-readable display name.
     * @param description - Brief description of the twin's purpose.
     * @returns The newly created {@link TwinModel}.
     */
    create(userId: string, name: string, description: string): Promise<TwinModel>;
    /**
     * Retrieves a twin by its unique ID.
     *
     * @param twinId - The twin's UUID.
     * @returns The twin model, or null if not found.
     */
    get(twinId: string): Promise<TwinModel | null>;
    /**
     * Retrieves the twin associated with a user ID.
     *
     * @param userId - The user or entity ID.
     * @returns The twin model, or null if none exists for this user.
     */
    getByUserId(userId: string): Promise<TwinModel | null>;
    /**
     * Updates mutable properties of an existing twin.
     *
     * @param twinId - The twin's UUID.
     * @param updates - Partial update payload.
     * @returns The updated twin model.
     * @throws Error if twin does not exist.
     */
    update(twinId: string, updates: TwinUpdate): Promise<TwinModel>;
    /**
     * Synchronizes data into the twin and creates a sync record.
     *
     * @param twinId - The twin's UUID.
     * @param data - Arbitrary payload to sync (behavior, preferences, etc.).
     * @returns The created {@link TwinSync} record.
     * @throws Error if twin does not exist.
     */
    sync(twinId: string, data: unknown): Promise<TwinSync>;
    /**
     * Adds a capability to the twin's capability list.
     *
     * @param twinId - The twin's UUID.
     * @param capability - The capability to add.
     * @returns The updated twin model.
     * @throws Error if twin does not exist.
     */
    addCapability(twinId: string, capability: TwinCapability): Promise<TwinModel>;
    /**
     * Retrieves the full sync history for a twin.
     *
     * @param twinId - The twin's UUID.
     * @returns Array of sync records, oldest first.
     */
    getSyncHistory(twinId: string): Promise<TwinSync[]>;
    /**
     * Retrieves all twins with the given status.
     *
     * @param status - The status filter to apply.
     * @returns Array of matching twin models.
     */
    getByStatus(status: TwinStatus): Promise<TwinModel[]>;
    /**
     * Permanently deletes a twin and its sync history.
     *
     * @param twinId - The twin's UUID.
     * @returns True if deletion succeeded, false if twin was not found.
     */
    delete(twinId: string): Promise<boolean>;
    /**
     * Returns the current learning progress percentage (0-100).
     *
     * @param twinId - The twin's UUID.
     * @returns Learning progress as a number.
     * @throws Error if twin does not exist.
     */
    getLearningProgress(twinId: string): Promise<number>;
    /**
     * Updates the status of a twin.
     *
     * @param twinId - The twin's UUID.
     * @param status - The new status.
     */
    private updateStatus;
    /**
     * Infers a sync type string from the data payload structure.
     *
     * @param data - The sync payload.
     * @returns A type label string.
     */
    private inferSyncType;
}
/** Shared singleton instance for use across the application. */
export declare const cosmicTwinService: CosmicTwinService;
//# sourceMappingURL=cosmicTwinService.d.ts.map
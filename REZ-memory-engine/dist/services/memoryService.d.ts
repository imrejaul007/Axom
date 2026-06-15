import type { Memory, MemoryContext, MemorySearchOptions, MemoryType, PaginatedMemoryResponse } from "../types.js";
import { MemoryCategory } from "../types.js";
/**
 * Service layer for memory operations.
 *
 * Stores and retrieves user memories/context for AI agents.
 * Uses in-memory storage for development/testing.
 */
export declare class MemoryService {
    private store;
    constructor();
    /**
     * Store a new memory for a user.
     *
     * @param userId - The owner of the memory
     * @param type - The type of memory
     * @param content - The memory content
     * @param context - Optional contextual metadata
     * @param category - Category for organization
     * @param tags - Searchable tags
     * @param importance - Importance level (1-5)
     * @returns The created memory
     */
    storeMemory(userId: string, type: MemoryType, content: string, context?: MemoryContext, category?: MemoryCategory, tags?: string[], importance?: number): Promise<Memory>;
    /**
     * Get a single memory by ID.
     *
     * @param memoryId - The memory ID
     * @returns The memory or null if not found
     */
    get(memoryId: string): Promise<Memory | null>;
    /**
     * Get memories for a user with pagination and optional filters.
     *
     * @param userId - The user ID
     * @param options - Filter and pagination options
     * @returns Paginated memory results
     */
    getByUserId(userId: string, options?: MemorySearchOptions): Promise<PaginatedMemoryResponse>;
    /**
     * Search memories by content and tags.
     *
     * @param userId - The user ID
     * @param query - Search query string
     * @returns Matching memories sorted by importance
     */
    search(userId: string, query: string): Promise<Memory[]>;
    /**
     * Get memories filtered by category.
     *
     * @param userId - The user ID
     * @param category - Category to filter by
     * @returns Matching memories
     */
    getByCategory(userId: string, category: MemoryCategory): Promise<Memory[]>;
    /**
     * Delete a memory by ID.
     *
     * @param memoryId - The memory ID
     * @returns True if deleted, false if not found
     */
    delete(memoryId: string): Promise<boolean>;
    /**
     * Update access metadata for a memory.
     *
     * @param memoryId - The memory ID
     */
    updateAccess(memoryId: string): Promise<void>;
    /**
     * Get the most relevant memories for AI context injection.
     * Sorted by a weighted score of importance and recency.
     *
     * @param userId - The user ID
     * @param maxMemories - Maximum number of memories to return (default 10)
     * @returns Top memories sorted by relevance
     */
    getContext(userId: string, maxMemories?: number): Promise<Memory[]>;
    /** Clears all memories from the store. For test isolation. */
    resetStore(): void;
}
export declare const memoryService: MemoryService;
//# sourceMappingURL=memoryService.d.ts.map
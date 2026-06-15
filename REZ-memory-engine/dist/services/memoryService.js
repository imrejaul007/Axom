import { v4 as uuidv4 } from "uuid";
import { MemoryCategory } from "../types.js";
/**
 * In-memory store for memory records.
 * Uses a Map keyed by memory ID with a secondary index on userId.
 */
class MemoryStore {
    memories = new Map();
    userIndex = new Map();
    put(memory) {
        this.memories.set(memory.id, memory);
        const userSet = this.userIndex.get(memory.userId) ?? new Set();
        userSet.add(memory.id);
        this.userIndex.set(memory.userId, userSet);
    }
    get(id) {
        return this.memories.get(id);
    }
    delete(id) {
        const memory = this.memories.get(id);
        if (!memory)
            return false;
        this.memories.delete(id);
        const userSet = this.userIndex.get(memory.userId);
        if (userSet) {
            userSet.delete(id);
            if (userSet.size === 0)
                this.userIndex.delete(memory.userId);
        }
        return true;
    }
    getIdsForUser(userId) {
        const userSet = this.userIndex.get(userId);
        return userSet ? Array.from(userSet) : [];
    }
    getByUserId(userId, options = {}) {
        let ids = this.getIdsForUser(userId);
        let results = ids.map((id) => this.memories.get(id)).filter(Boolean);
        if (options.types && options.types.length > 0) {
            results = results.filter((m) => options.types.includes(m.type));
        }
        if (options.categories && options.categories.length > 0) {
            results = results.filter((m) => options.categories.includes(m.category));
        }
        if (options.tags && options.tags.length > 0) {
            results = results.filter((m) => options.tags.every((t) => m.tags.includes(t)));
        }
        if (options.minImportance) {
            results = results.filter((m) => m.importance >= options.minImportance);
        }
        const total = results.length;
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const sortBy = options.sortBy ?? "createdAt";
        const sortOrder = options.sortOrder ?? "desc";
        results.sort((a, b) => {
            let cmp = 0;
            switch (sortBy) {
                case "createdAt":
                    cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                    break;
                case "accessedAt":
                    cmp = new Date(a.accessedAt).getTime() - new Date(b.accessedAt).getTime();
                    break;
                case "importance":
                    cmp = a.importance - b.importance;
                    break;
            }
            return sortOrder === "desc" ? -cmp : cmp;
        });
        const start = (page - 1) * limit;
        const paginated = results.slice(start, start + limit);
        return {
            data: paginated,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }
    search(userId, query) {
        const ids = this.getIdsForUser(userId);
        const lowerQuery = query.toLowerCase();
        return Array.from(ids)
            .map((id) => this.memories.get(id))
            .filter((m) => m.content.toLowerCase().includes(lowerQuery) ||
            m.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
            .sort((a, b) => b.importance - a.importance);
    }
    getAllForUser(userId) {
        return this.getIdsForUser(userId)
            .map((id) => this.memories.get(id))
            .filter(Boolean);
    }
    /** Clears all stored data. Used for test isolation. */
    reset() {
        this.memories.clear();
        this.userIndex.clear();
    }
}
const memoryStore = new MemoryStore();
/**
 * Service layer for memory operations.
 *
 * Stores and retrieves user memories/context for AI agents.
 * Uses in-memory storage for development/testing.
 */
export class MemoryService {
    store;
    constructor() {
        this.store = memoryStore;
    }
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
    async storeMemory(userId, type, content, context = {}, category = MemoryCategory.PERSONAL, tags = [], importance = 3) {
        const now = new Date().toISOString();
        const memory = {
            id: uuidv4(),
            userId,
            type,
            content,
            context,
            category,
            tags,
            importance: Math.max(1, Math.min(5, importance)),
            createdAt: now,
            accessedAt: now,
            accessedCount: 0,
        };
        this.store.put(memory);
        return memory;
    }
    /**
     * Get a single memory by ID.
     *
     * @param memoryId - The memory ID
     * @returns The memory or null if not found
     */
    async get(memoryId) {
        const memory = this.store.get(memoryId);
        if (memory) {
            await this.updateAccess(memoryId);
        }
        return memory ?? null;
    }
    /**
     * Get memories for a user with pagination and optional filters.
     *
     * @param userId - The user ID
     * @param options - Filter and pagination options
     * @returns Paginated memory results
     */
    async getByUserId(userId, options = {}) {
        return this.store.getByUserId(userId, options);
    }
    /**
     * Search memories by content and tags.
     *
     * @param userId - The user ID
     * @param query - Search query string
     * @returns Matching memories sorted by importance
     */
    async search(userId, query) {
        return this.store.search(userId, query);
    }
    /**
     * Get memories filtered by category.
     *
     * @param userId - The user ID
     * @param category - Category to filter by
     * @returns Matching memories
     */
    async getByCategory(userId, category) {
        const all = this.store.getAllForUser(userId);
        return all
            .filter((m) => m.category === category)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    /**
     * Delete a memory by ID.
     *
     * @param memoryId - The memory ID
     * @returns True if deleted, false if not found
     */
    async delete(memoryId) {
        return this.store.delete(memoryId);
    }
    /**
     * Update access metadata for a memory.
     *
     * @param memoryId - The memory ID
     */
    async updateAccess(memoryId) {
        const memory = this.store.get(memoryId);
        if (!memory)
            return;
        memory.accessedAt = new Date().toISOString();
        memory.accessedCount += 1;
    }
    /**
     * Get the most relevant memories for AI context injection.
     * Sorted by a weighted score of importance and recency.
     *
     * @param userId - The user ID
     * @param maxMemories - Maximum number of memories to return (default 10)
     * @returns Top memories sorted by relevance
     */
    async getContext(userId, maxMemories = 10) {
        const all = this.store.getAllForUser(userId);
        const now = Date.now();
        const scored = all.map((m) => {
            const recencyMs = now - new Date(m.createdAt).getTime();
            const recencyHours = recencyMs / (1000 * 60 * 60);
            const recencyScore = Math.max(0.1, 1 - recencyHours / (30 * 24));
            const score = m.importance * 0.6 + recencyScore * 0.4 * 5;
            return { memory: m, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, maxMemories).map((s) => s.memory);
    }
    /** Clears all memories from the store. For test isolation. */
    resetStore() {
        this.store.reset();
    }
}
export const memoryService = new MemoryService();
//# sourceMappingURL=memoryService.js.map
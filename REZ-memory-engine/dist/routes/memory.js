import { Router } from "express";
import { z } from "zod";
import { memoryService } from "../services/memoryService.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { MemoryType, MemoryCategory } from "../types.js";
const router = Router();
/**
 * Request body for storing a new memory.
 */
const storeMemoryBody = z.object({
    userId: z.string().min(1),
    type: z.nativeEnum(MemoryType),
    content: z.string().min(1),
    context: z.record(z.unknown()).optional(),
    category: z.nativeEnum(MemoryCategory).optional(),
    tags: z.array(z.string()).optional(),
    importance: z.number().int().min(1).max(5).optional(),
});
/**
 * Query params for search.
 */
const searchQuery = z.object({
    q: z.string().min(1),
});
/**
 * Query params for pagination.
 */
const paginationQuery = z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});
/**
 * Query params for context retrieval.
 */
const contextQuery = z.object({
    maxMemories: z.coerce.number().int().min(1).max(50).optional(),
});
/**
 * POST /api/memory/store
 * Store a new memory.
 */
router.post("/store", validateRequest(storeMemoryBody, "body"), async (req, res, next) => {
    try {
        const { userId, type, content, context, category, tags, importance } = req.validated;
        const memory = await memoryService.storeMemory(userId, type, content, context ?? {}, category ?? MemoryCategory.PERSONAL, tags ?? [], importance ?? 3);
        res.status(201).json({ success: true, data: memory });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/memory/:userId
 * Get all memories for a user with pagination.
 */
router.get("/:userId", validateRequest(paginationQuery, "query"), async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page, limit } = req.validated;
        const result = await memoryService.getByUserId(userId, { page, limit });
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/memory/:userId/search?q=query
 * Search memories by content and tags.
 */
router.get("/:userId/search", validateRequest(searchQuery, "query"), async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { q } = req.validated;
        const results = await memoryService.search(userId, q);
        res.json({ success: true, data: results, count: results.length });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/memory/:userId/category/:category
 * Get memories by category.
 */
router.get("/:userId/category/:category", async (req, res, next) => {
    try {
        const { userId, category } = req.params;
        const parsedCategory = z.nativeEnum(MemoryCategory).safeParse(category);
        if (!parsedCategory.success) {
            res.status(400).json({ error: `Invalid category: ${category}` });
            return;
        }
        const results = await memoryService.getByCategory(userId, parsedCategory.data);
        res.json({ success: true, data: results, count: results.length });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/memory/:userId/context
 * Get most relevant memories for AI context injection.
 */
router.get("/:userId/context", validateRequest(contextQuery, "query"), async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { maxMemories } = req.validated;
        const results = await memoryService.getContext(userId, maxMemories ?? 10);
        res.json({ success: true, data: results, count: results.length });
    }
    catch (err) {
        next(err);
    }
});
/**
 * GET /api/memory/item/:id
 * Get a single memory by ID.
 */
router.get("/item/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const memory = await memoryService.get(id);
        if (!memory) {
            res.status(404).json({ error: "Memory not found" });
            return;
        }
        res.json({ success: true, data: memory });
    }
    catch (err) {
        next(err);
    }
});
/**
 * DELETE /api/memory/:id
 * Delete a memory by ID.
 */
router.delete("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await memoryService.delete(id);
        if (!deleted) {
            res.status(404).json({ error: "Memory not found" });
            return;
        }
        res.json({ success: true, deleted: true });
    }
    catch (err) {
        next(err);
    }
});
export default router;
//# sourceMappingURL=memory.js.map
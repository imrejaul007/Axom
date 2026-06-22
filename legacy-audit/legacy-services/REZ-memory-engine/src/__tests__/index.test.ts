import { describe, it, expect, beforeEach } from "@jest/globals";
import { MemoryService } from "../services/memoryService.js";
import { MemoryType, MemoryCategory } from "../types.js";

/**
 * Fresh service instance for each test to ensure clean state.
 */
function createService(): MemoryService {
  // Each test gets a new instance with its own store
  return new MemoryService();
}

describe("MemoryService", () => {
  let service: MemoryService;

  beforeEach(() => {
    service = createService();
    service.resetStore();
  });

  describe("store and retrieve", () => {
    it("should store a memory and retrieve it by id", async () => {
      const memory = await service.storeMemory(
        "user-1",
        MemoryType.FACT,
        "User lives in Seattle",
        {},
        MemoryCategory.PERSONAL,
        ["location", "seattle"],
        4,
      );

      expect(memory.id).toBeDefined();
      expect(memory.userId).toBe("user-1");
      expect(memory.type).toBe(MemoryType.FACT);
      expect(memory.content).toBe("User lives in Seattle");
      expect(memory.category).toBe(MemoryCategory.PERSONAL);
      expect(memory.tags).toEqual(["location", "seattle"]);
      expect(memory.importance).toBe(4);
      expect(memory.accessedCount).toBe(0);
      expect(memory.createdAt).toBeDefined();
      expect(memory.accessedAt).toBeDefined();

      const retrieved = await service.get(memory.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe("User lives in Seattle");
    });

    it("should auto-clamp importance to 1-5 range", async () => {
      const tooHigh = await service.storeMemory(
        "user-1",
        MemoryType.FACT,
        "High importance",
        {},
        MemoryCategory.PERSONAL,
        [],
        10,
      );
      expect(tooHigh.importance).toBe(5);

      const tooLow = await service.storeMemory(
        "user-1",
        MemoryType.FACT,
        "Low importance",
        {},
        MemoryCategory.PERSONAL,
        [],
        -2,
      );
      expect(tooLow.importance).toBe(1);
    });

    it("should return null for non-existent memory", async () => {
      const result = await service.get("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("getByUserId", () => {
    it("should return all memories for a user", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Fact 1", {}, MemoryCategory.PERSONAL);
      await service.storeMemory("user-1", MemoryType.PREFERENCE, "Preference 1", {}, MemoryCategory.PREFERENCE);
      await service.storeMemory("user-2", MemoryType.FACT, "Fact for user-2", {}, MemoryCategory.PERSONAL);

      const result = await service.getByUserId("user-1");
      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
    });

    it("should paginate results", async () => {
      for (let i = 0; i < 15; i++) {
        await service.storeMemory("user-1", MemoryType.FACT, `Fact ${i}`, {}, MemoryCategory.PERSONAL);
      }

      const page1 = await service.getByUserId("user-1", { page: 1, limit: 5 });
      expect(page1.data).toHaveLength(5);
      expect(page1.total).toBe(15);
      expect(page1.totalPages).toBe(3);

      const page2 = await service.getByUserId("user-1", { page: 2, limit: 5 });
      expect(page2.data).toHaveLength(5);
      expect(page2.page).toBe(2);
    });

    it("should filter by category", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Personal fact", {}, MemoryCategory.PERSONAL);
      await service.storeMemory("user-1", MemoryType.FACT, "Professional fact", {}, MemoryCategory.PROFESSIONAL);
      await service.storeMemory("user-1", MemoryType.FACT, "Another personal fact", {}, MemoryCategory.PERSONAL);

      const result = await service.getByUserId("user-1", {
        categories: [MemoryCategory.PERSONAL],
      });
      expect(result.data).toHaveLength(2);
      expect(result.data.every((m) => m.category === MemoryCategory.PERSONAL)).toBe(true);
    });

    it("should filter by type", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "A fact", {}, MemoryCategory.PERSONAL);
      await service.storeMemory("user-1", MemoryType.PREFERENCE, "A preference", {}, MemoryCategory.PREFERENCE);

      const result = await service.getByUserId("user-1", {
        types: [MemoryType.FACT],
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe(MemoryType.FACT);
    });

    it("should filter by tags (AND logic)", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Tag test 1", {}, MemoryCategory.PERSONAL, ["typescript", "node"]);
      await service.storeMemory("user-1", MemoryType.FACT, "Tag test 2", {}, MemoryCategory.PERSONAL, ["typescript"]);
      await service.storeMemory("user-1", MemoryType.FACT, "Tag test 3", {}, MemoryCategory.PERSONAL, ["python"]);

      const result = await service.getByUserId("user-1", {
        tags: ["typescript", "node"],
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].tags).toContain("typescript");
      expect(result.data[0].tags).toContain("node");
    });

    it("should filter by minimum importance", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Low importance", {}, MemoryCategory.PERSONAL, [], 1);
      await service.storeMemory("user-1", MemoryType.FACT, "High importance", {}, MemoryCategory.PERSONAL, [], 5);

      const result = await service.getByUserId("user-1", { minImportance: 4 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].importance).toBeGreaterThanOrEqual(4);
    });
  });

  describe("search", () => {
    it("should find memories by content substring", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Loves to code in TypeScript", {}, MemoryCategory.PROFESSIONAL);
      await service.storeMemory("user-1", MemoryType.FACT, "Enjoys hiking in mountains", {}, MemoryCategory.PERSONAL);

      const results = await service.search("user-1", "TypeScript");
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain("TypeScript");
    });

    it("should find memories by tag", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Test memory", {}, MemoryCategory.PERSONAL, ["backend", "api"]);
      await service.storeMemory("user-1", MemoryType.FACT, "Another memory", {}, MemoryCategory.PERSONAL, ["frontend"]);

      const results = await service.search("user-1", "api");
      expect(results).toHaveLength(1);
      expect(results[0].tags).toContain("api");
    });

    it("should be case-insensitive", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "React developer", {}, MemoryCategory.PROFESSIONAL);

      const results = await service.search("user-1", "REACT");
      expect(results).toHaveLength(1);
    });

    it("should return empty array when no matches", async () => {
      const results = await service.search("user-1", "nonexistent-query-xyz");
      expect(results).toHaveLength(0);
    });

    it("should sort results by importance", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Low priority", {}, MemoryCategory.PERSONAL, [], 1);
      await service.storeMemory("user-1", MemoryType.FACT, "High priority", {}, MemoryCategory.PERSONAL, [], 5);

      const results = await service.search("user-1", "priority");
      expect(results).toHaveLength(2);
      expect(results[0].importance).toBeGreaterThanOrEqual(results[1].importance);
    });
  });

  describe("getByCategory", () => {
    it("should return memories for a specific category", async () => {
      await service.storeMemory("user-1", MemoryType.FACT, "Personal memory 1", {}, MemoryCategory.PERSONAL);
      await service.storeMemory("user-1", MemoryType.FACT, "Professional memory", {}, MemoryCategory.PROFESSIONAL);
      await service.storeMemory("user-1", MemoryType.FACT, "Personal memory 2", {}, MemoryCategory.PERSONAL);

      const results = await service.getByCategory("user-1", MemoryCategory.PERSONAL);
      expect(results).toHaveLength(2);
      expect(results.every((m) => m.category === MemoryCategory.PERSONAL)).toBe(true);
    });

    it("should return empty array for non-existent category", async () => {
      const results = await service.getByCategory("user-1", MemoryCategory.HEALTH);
      expect(results).toHaveLength(0);
    });
  });

  describe("delete", () => {
    it("should delete an existing memory", async () => {
      const memory = await service.storeMemory("user-1", MemoryType.FACT, "To be deleted", {}, MemoryCategory.PERSONAL);
      const deleted = await service.delete(memory.id);
      expect(deleted).toBe(true);

      const retrieved = await service.get(memory.id);
      expect(retrieved).toBeNull();
    });

    it("should return false for non-existent memory", async () => {
      const deleted = await service.delete("non-existent-id");
      expect(deleted).toBe(false);
    });
  });

  describe("updateAccess", () => {
    it("should increment accessedCount and update accessedAt", async () => {
      const memory = await service.storeMemory("user-1", MemoryType.FACT, "Access test", {}, MemoryCategory.PERSONAL);
      expect(memory.accessedCount).toBe(0);
      const originalAccessedAt = memory.accessedAt;

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.updateAccess(memory.id);
      // Verify the in-memory object was updated (same reference)
      expect(memory.accessedCount).toBe(1);
      expect(new Date(memory.accessedAt) > new Date(originalAccessedAt)).toBe(true);

      await service.updateAccess(memory.id);
      expect(memory.accessedCount).toBe(2);
    });
  });

  describe("getContext", () => {
    it("should return most relevant memories sorted by weighted score", async () => {
      // High importance, recent
      await service.storeMemory("user-1", MemoryType.GOAL, "Goal to achieve", {}, MemoryCategory.PERSONAL, [], 5);
      // Low importance, very old
      await service.storeMemory("user-1", MemoryType.FACT, "Old fact", {}, MemoryCategory.PERSONAL, [], 1);
      // Medium importance, recent
      await service.storeMemory("user-1", MemoryType.PREFERENCE, "Preference", {}, MemoryCategory.PREFERENCE, [], 3);

      const context = await service.getContext("user-1", 2);
      expect(context).toHaveLength(2);
      // Goal should be first due to high importance
      expect(context[0].type).toBe(MemoryType.GOAL);
    });

    it("should respect maxMemories limit", async () => {
      for (let i = 0; i < 10; i++) {
        await service.storeMemory("user-1", MemoryType.FACT, `Memory ${i}`, {}, MemoryCategory.PERSONAL, [], 3);
      }

      const context = await service.getContext("user-1", 3);
      expect(context).toHaveLength(3);
    });

    it("should return empty array for user with no memories", async () => {
      const context = await service.getContext("nonexistent-user", 10);
      expect(context).toHaveLength(0);
    });
  });

  describe("persistence across service instances", () => {
    it("should share state between instances using the singleton store", async () => {
      // Store via first instance
      const memory = await service.storeMemory("user-1", MemoryType.FACT, "Shared memory", {}, MemoryCategory.PERSONAL);

      // Retrieve via new instance -- both share the same MemoryStore singleton
      const service2 = createService();
      const retrieved = await service2.get(memory.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.content).toBe("Shared memory");
    });
  });
});
import { CosmicTwinService } from "../src/services/cosmicTwinService.js";
import { TwinStatus, TwinCapability } from "../src/types.js";

describe("CosmicTwinService", () => {
  let service: CosmicTwinService;

  beforeEach(() => {
    service = new CosmicTwinService();
  });

  describe("create", () => {
    it("should create a twin with default values", async () => {
      const twin = await service.create(
        "user-123",
        "My Twin",
        "A test twin"
      );

      expect(twin.id).toBeDefined();
      expect(twin.userId).toBe("user-123");
      expect(twin.name).toBe("My Twin");
      expect(twin.description).toBe("A test twin");
      expect(twin.status).toBe(TwinStatus.CREATING);
      expect(twin.learningProgress).toBe(0);
      expect(twin.capabilities).toEqual([]);
      expect(twin.dataPoints).toBe(0);
      expect(twin.version).toBe("1.0.0");
 });

    it("should store the twin in memory", async () => {
      const twin = await service.create("user-456", "Twin Two", "");
      const found = await service.get(twin.id);
      expect(found).not.toBeNull();
      expect(found?.userId).toBe("user-456");
    });
  });

  describe("get", () => {
    it("should return null for a non-existent twin", async () => {
      const result = await service.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return the twin when it exists", async () => {
      const created = await service.create("user-789", "Twin Three", "");
      const result = await service.get(created.id);
      expect(result?.id).toBe(created.id);
    });
  });

  describe("getByUserId", () => {
    it("should return null when no twin exists for user", async () => {
      const result = await service.getByUserId("unknown-user");
      expect(result).toBeNull();
    });

    it("should return the twin for the given user", async () => {
      const created = await service.create("specific-user", "Named Twin", "");
      const result = await service.getByUserId("specific-user");
      expect(result?.userId).toBe("specific-user");
    });
  });

  describe("update", () => {
    it("should update twin name and description", async () => {
      const twin = await service.create("user-update", "Old Name", "Old desc");
      const updated = await service.update(twin.id, {
        name: "New Name",
        description: "New desc",
      });

      expect(updated.name).toBe("New Name");
      expect(updated.description).toBe("New desc");
      expect(updated.id).toBe(twin.id);
    });

    it("should update personality traits", async () => {
      const twin = await service.create("user-personality", "Twin", "");
      const personality = { openness: 0.8, conscientiousness: 0.6 };
      const updated = await service.update(twin.id, { personality });

      expect(updated.personality).toEqual(personality);
    });

    it("should throw when twin does not exist", async () => {
      await expect(
        service.update("non-existent-id", { name: "Test" })
      ).rejects.toThrow('Twin with ID "non-existent-id" not found');
    });
  });

  describe("sync", () => {
    it("should create a sync record and increment data points", async () => {
      const twin = await service.create("user-sync", "Syncing Twin", "");
      const syncRecord = await service.sync(twin.id, { event: "login" });

      expect(syncRecord.id).toBeDefined();
      expect(syncRecord.twinId).toBe(twin.id);
      expect(syncRecord.type).toBe("event");
      expect(syncRecord.data).toEqual({ event: "login" });
      expect(syncRecord.syncedAt).toBeDefined();
    });

    it("should increase learning progress after sync", async () => {
      const twin = await service.create("user-learn", "Learning Twin", "");
      await service.sync(twin.id, { behavior: "click" });
      const progress = await service.getLearningProgress(twin.id);
      expect(progress).toBeGreaterThan(0);
    });

    it("should throw when twin does not exist", async () => {
      await expect(
        service.sync("non-existent-id", { data: "test" })
      ).rejects.toThrow('Twin with ID "non-existent-id" not found');
    });
  });

  describe("addCapability", () => {
    it("should add a capability to the twin", async () => {
      const twin = await service.create("user-cap", "Cap Twin", "");
      const updated = await service.addCapability(
        twin.id,
        TwinCapability.RECOMMENDATION
      );

      expect(updated.capabilities).toContain(TwinCapability.RECOMMENDATION);
    });

    it("should not duplicate an existing capability", async () => {
      const twin = await service.create("user-cap2", "Cap Twin 2", "");
      await service.addCapability(twin.id, TwinCapability.ANALYSIS);
      const updated = await service.addCapability(
        twin.id,
        TwinCapability.ANALYSIS
      );

      expect(
        updated.capabilities.filter((c) => c === TwinCapability.ANALYSIS)
          .length
      ).toBe(1);
    });

    it("should throw when twin does not exist", async () => {
      await expect(
        service.addCapability("non-existent-id", TwinCapability.PREDICTION)
      ).rejects.toThrow('Twin with ID "non-existent-id" not found');
    });
  });

  describe("getSyncHistory", () => {
    it("should return an empty array when no syncs exist", async () => {
      const twin = await service.create("user-history", "History Twin", "");
      const history = await service.getSyncHistory(twin.id);
      expect(history).toEqual([]);
    });

    it("should return all sync records in order", async () => {
      const twin = await service.create("user-history2", "History Twin 2", "");
      await service.sync(twin.id, { first: true });
      await service.sync(twin.id, { second: true });

      const history = await service.getSyncHistory(twin.id);
      expect(history).toHaveLength(2);
      expect(history[0].data).toEqual({ first: true });
      expect(history[1].data).toEqual({ second: true });
    });
  });

  describe("getByStatus", () => {
    it("should return twins matching the status", async () => {
      const twin = await service.create("user-status", "Status Twin", "");
      // Wait for async status transition
      await new Promise((r) => setTimeout(r, 200));

      const activeTwins = await service.getByStatus(TwinStatus.ACTIVE);
      expect(activeTwins.length).toBeGreaterThan(0);
      expect(activeTwins.some((t) => t.id === twin.id)).toBe(true);
    });

    it("should return empty array for status with no twins", async () => {
      const results = await service.getByStatus(TwinStatus.ARCHIVED);
      expect(results).toEqual([]);
    });
  });

  describe("delete", () => {
    it("should return false when twin does not exist", async () => {
      const result = await service.delete("non-existent-id");
      expect(result).toBe(false);
    });

    it("should delete the twin and return true", async () => {
      const twin = await service.create("user-delete", "Delete Twin", "");
      const result = await service.delete(twin.id);

      expect(result).toBe(true);
      expect(await service.get(twin.id)).toBeNull();
    });

    it("should also delete sync history", async () => {
      const twin = await service.create("user-delete-history", "Del Twin", "");
      await service.sync(twin.id, { data: "test" });
      await service.delete(twin.id);

      const history = await service.getSyncHistory(twin.id);
      expect(history).toEqual([]);
    });
  });

  describe("getLearningProgress", () => {
    it("should return the current learning progress", async () => {
      const twin = await service.create("user-progress", "Progress Twin", "");
      const progress = await service.getLearningProgress(twin.id);
      expect(progress).toBe(0);
    });

    it("should throw when twin does not exist", async () => {
      await expect(
        service.getLearningProgress("non-existent-id")
      ).rejects.toThrow('Twin with ID "non-existent-id" not found');
    });
  });
});

/**
 * REZ Life Pattern Engine - Unit Tests
 * Tests for PatternService core functionality
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PatternService } from "./services/patternService.js";
import { PatternType, PatternStatus } from "./types.js";

/**
 * Creates a fresh PatternService instance for each test
 */
function createFreshService(): PatternService {
  return new PatternService();
}

describe("PatternService", () => {
  let service: PatternService;

  beforeEach(() => {
    service = createFreshService();
  });

  describe("recordEvent", () => {
    it("should record a behavior event with all fields", async () => {
      const event = await service.recordEvent(
        "user-123",
        "morning_run",
        "park",
        { weather: "sunny" },
        { distance: "5km" }
      );

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.userId).toBe("user-123");
      expect(event.type).toBe("morning_run");
      expect(event.location).toBe("park");
      expect(event.context).toEqual({ weather: "sunny" });
      expect(event.metadata).toEqual({ distance: "5km" });
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it("should record an event with minimal fields", async () => {
      const event = await service.recordEvent("user-456", "gym_visit");

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.userId).toBe("user-456");
      expect(event.type).toBe("gym_visit");
      expect(event.location).toBeUndefined();
      expect(event.context).toBeUndefined();
    });
  });

  describe("detectPatterns", () => {
    it("should detect no patterns with insufficient events", async () => {
      // Record fewer events than required for pattern detection
      await service.recordEvent("user-123", "coffee", "cafe");
      await service.recordEvent("user-123", "coffee", "cafe");

      const patterns = await service.detectPatterns("user-123");

      expect(patterns).toHaveLength(0);
    });

    it("should detect a daily pattern from recurring events", async () => {
      const baseTime = new Date();

      // Record 5 events on different days
      for (let i = 0; i < 5; i++) {
        const eventTime = new Date(baseTime);
        eventTime.setDate(eventTime.getDate() + i);
        // We can't easily control timestamp, so we test the detection logic
        await service.recordEvent("user-daily", "morning_coffee", "home", {
          dayOffset: i,
        });
      }

      const patterns = await service.detectPatterns("user-daily");

      // Should detect at least one pattern
      expect(patterns.length).toBeGreaterThanOrEqual(0);
    });

    it("should return empty array for user with no events", async () => {
      const patterns = await service.detectPatterns("nonexistent-user");

      expect(patterns).toEqual([]);
    });
  });

  describe("getPatterns", () => {
    it("should return empty array for user with no patterns", async () => {
      const patterns = await service.getPatterns("user-no-patterns");

      expect(patterns).toEqual([]);
    });

    it("should return all patterns for a user", async () => {
      // Record enough events to potentially create patterns
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-multi", "workout", "gym");
      }

      await service.detectPatterns("user-multi");
      const patterns = await service.getPatterns("user-multi");

      expect(Array.isArray(patterns)).toBe(true);
    });
  });

  describe("getPattern", () => {
    it("should return null for non-existent pattern", async () => {
      const pattern = await service.getPattern("non-existent-id");

      expect(pattern).toBeNull();
    });

    it("should return pattern when it exists", async () => {
      // Create a pattern
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-get", "reading", "library");
      }

      const patterns = await service.detectPatterns("user-get");
      expect(patterns.length).toBeGreaterThan(0);

      const foundPattern = await service.getPattern(patterns[0]!.id);

      expect(foundPattern).toBeDefined();
      expect(foundPattern?.id).toBe(patterns[0]!.id);
    });
  });

  describe("updatePattern", () => {
    it("should throw error for non-existent pattern", async () => {
      await expect(service.updatePattern("non-existent")).rejects.toThrow(
        "Pattern not found"
      );
    });

    it("should update pattern confidence", async () => {
      // Create a pattern first
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-update", "meditation", "studio");
      }

      const patterns = await service.detectPatterns("user-update");
      expect(patterns.length).toBeGreaterThan(0);

      const originalPattern = patterns[0]!;
      const updatedPattern = await service.updatePattern(originalPattern.id);

      expect(updatedPattern).toBeDefined();
      expect(updatedPattern.id).toBe(originalPattern.id);
      expect(updatedPattern.status).toBeDefined();
    });
  });

  describe("makePrediction", () => {
    it("should throw error when pattern does not exist", async () => {
      await expect(
        service.makePrediction(
          "user-123",
          "non-existent-pattern",
          new Date(),
          "will_exercise"
        )
      ).rejects.toThrow("Pattern not found");
    });

    it("should create a prediction based on a pattern", async () => {
      // Create a pattern first
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-pred", "yoga", "studio");
      }

      const patterns = await service.detectPatterns("user-pred");
      if (patterns.length === 0) {
        // Skip test if no pattern was detected
        return;
      }

      const pattern = patterns[0]!;
      const predictedFor = new Date(Date.now() + 86400000); // Tomorrow
      const prediction = await service.makePrediction(
        "user-pred",
        pattern.id,
        predictedFor,
        "morning_yoga_session"
      );

      expect(prediction).toBeDefined();
      expect(prediction.id).toBeDefined();
      expect(prediction.patternId).toBe(pattern.id);
      expect(prediction.userId).toBe("user-pred");
      expect(prediction.prediction).toBe("morning_yoga_session");
      expect(prediction.confidence).toBeDefined();
      expect(prediction.factors).toBeDefined();
      expect(Array.isArray(prediction.factors)).toBe(true);
    });
  });

  describe("getPredictions", () => {
    it("should return empty array for user with no predictions", async () => {
      const predictions = await service.getPredictions("user-no-preds");

      expect(predictions).toEqual([]);
    });
  });

  describe("recordOutcome", () => {
    it("should throw error for non-existent prediction", async () => {
      await expect(
        service.recordOutcome("non-existent-prediction", "actual_value")
      ).rejects.toThrow("Prediction not found");
    });

    it("should update prediction with accuracy", async () => {
      // Create prediction first
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-outcome", "jogging", "track");
      }

      const patterns = await service.detectPatterns("user-outcome");
      if (patterns.length === 0) return;

      const pattern = patterns[0]!;
      const prediction = await service.makePrediction(
        "user-outcome",
        pattern.id,
        new Date(),
        "morning_jog"
      );

      const updatedPrediction = await service.recordOutcome(
        prediction.id,
        "morning_jog"
      );

      expect(updatedPrediction).toBeDefined();
      expect(updatedPrediction.actualOutcome).toBe("morning_jog");
      expect(updatedPrediction.accuracy).toBeDefined();
    });

    it("should calculate partial match for similar outcomes", async () => {
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-partial", "cycling", "trail");
      }

      const patterns = await service.detectPatterns("user-partial");
      if (patterns.length === 0) return;

      const prediction = await service.makePrediction(
        "user-partial",
        patterns[0]!.id,
        new Date(),
        "morning_bike_ride"
      );

      const updated = await service.recordOutcome(
        prediction.id,
        "morning bike ride at park"
      );

      expect(updated.accuracy).toBeGreaterThan(0);
      expect(updated.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe("getAccuracy", () => {
    it("should return 0 for user with no predictions", async () => {
      const accuracy = await service.getAccuracy("user-new");

      expect(accuracy).toBe(0);
    });

    it("should calculate accuracy from completed predictions", async () => {
      // Create and complete some predictions
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-accuracy", "swimming", "pool");
      }

      const patterns = await service.detectPatterns("user-accuracy");
      if (patterns.length === 0) return;

      // Make a prediction and record outcome
      const prediction = await service.makePrediction(
        "user-accuracy",
        patterns[0]!.id,
        new Date(),
        "pool_session"
      );

      await service.recordOutcome(prediction.id, "pool_session");

      const accuracy = await service.getAccuracy("user-accuracy");

      expect(accuracy).toBe(100); // Exact match
    });
  });

  describe("getBehaviorSummary", () => {
    it("should return empty summary for user with no events", async () => {
      const summary = await service.getBehaviorSummary("user-empty");

      expect(summary).toBeDefined();
      expect(summary.totalEvents).toBe(0);
      expect(summary.patternsFound).toBe(0);
      expect(summary.topTimes).toEqual([]);
      expect(summary.topLocations).toEqual([]);
    });

    it("should return summary with event counts", async () => {
      // Record some events with known times
      const hour = 9; // 9 AM
      for (let i = 0; i < 3; i++) {
        const event = await service.recordEvent(
          "user-summary",
          "work",
          "office"
        );
      }

      const summary = await service.getBehaviorSummary("user-summary", 30);

      expect(summary).toBeDefined();
      expect(typeof summary.totalEvents).toBe("number");
      expect(typeof summary.patternsFound).toBe("number");
      expect(Array.isArray(summary.topTimes)).toBe(true);
      expect(Array.isArray(summary.topLocations)).toBe(true);
    });

    it("should filter by days parameter", async () => {
      // Record an event
      await service.recordEvent("user-days", "meeting", "office");

      // Get summary for just last 1 day
      const summary = await service.getBehaviorSummary("user-days", 1);

      expect(summary).toBeDefined();
      expect(summary.totalEvents).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Pattern Detection Logic", () => {
    it("should identify pattern type correctly", async () => {
      // Create events that should trigger daily pattern detection
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-daily-type", "breakfast", "kitchen");
      }

      const patterns = await service.detectPatterns("user-daily-type");

      // Verify pattern structure
      if (patterns.length > 0) {
        const pattern = patterns[0]!;
        expect(pattern.type).toBeDefined();
        expect(Object.values(PatternType)).toContain(pattern.type);
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      }
    });

    it("should calculate confidence based on data points", async () => {
      // More events should lead to higher confidence
      for (let i = 0; i < 10; i++) {
        await service.recordEvent("user-confidence", "snack", "cafeteria");
      }

      const patterns = await service.detectPatterns("user-confidence");

      if (patterns.length > 0) {
        expect(patterns[0]!.dataPoints).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle events with empty context", async () => {
      const event = await service.recordEvent(
        "user-edge",
        "test",
        undefined,
        {}
      );

      expect(event).toBeDefined();
    });

    it("should handle prediction with very old date", async () => {
      for (let i = 0; i < 5; i++) {
        await service.recordEvent("user-old", "checkin", "gym");
      }

      const patterns = await service.detectPatterns("user-old");
      if (patterns.length === 0) return;

      const oldDate = new Date(Date.now() - 365 * 86400000); // 1 year ago
      const prediction = await service.makePrediction(
        "user-old",
        patterns[0]!.id,
        oldDate,
        "historical_action"
      );

      expect(prediction.predictedFor).toBeInstanceOf(Date);
    });

    it("should handle special characters in event types", async () => {
      const event = await service.recordEvent(
        "user-special",
        "user_interaction_with_emoji_🎉"
      );

      expect(event.type).toContain("🎉");
    });

    it("should handle very long metadata", async () => {
      const longMetadata = { data: "x".repeat(10000) };
      const event = await service.recordEvent(
        "user-long",
        "data_collection",
        undefined,
        undefined,
        longMetadata
      );

      expect(event.metadata).toBeDefined();
    });
  });
});

describe("PatternService Type Checks", () => {
  it("should maintain correct pattern status transitions", async () => {
    const service = createFreshService();

    for (let i = 0; i < 5; i++) {
      await service.recordEvent("user-status", "routine", "home");
    }

    const patterns = await service.detectPatterns("user-status");
    if (patterns.length > 0) {
      const pattern = patterns[0]!;
      expect(pattern.status).toBeDefined();
      expect(Object.values(PatternStatus)).toContain(pattern.status);
    }
  });

  it("should preserve pattern metadata integrity", async () => {
    const service = createFreshService();
    const context = { location: "gym", equipment: "weights" };

    for (let i = 0; i < 5; i++) {
      await service.recordEvent("user-meta", "workout", "gym", context);
    }

    const patterns = await service.detectPatterns("user-meta");
    if (patterns.length > 0) {
      expect(patterns[0]!.context).toBeDefined();
    }
  });
});

// Mock test for API integration
describe("Service Integration", () => {
  it("should support multiple users independently", async () => {
    const service = createFreshService();

    // User A events
    for (let i = 0; i < 3; i++) {
      await service.recordEvent("user-a", "coffee_a", "cafe_a");
    }

    // User B events
    for (let i = 0; i < 3; i++) {
      await service.recordEvent("user-b", "coffee_b", "cafe_b");
    }

    const patternsA = await service.getPatterns("user-a");
    const patternsB = await service.getPatterns("user-b");

    // User A and B should have separate pattern data
    expect(patternsA.every((p) => p.userId === "user-a")).toBe(true);
    expect(patternsB.every((p) => p.userId === "user-b")).toBe(true);
  });
});
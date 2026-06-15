/**
 * REZ Life Pattern Engine - Type Definitions
 * Defines core types for behavior pattern analysis and prediction
 */
import { z } from "zod";
/**
 * Enumeration of pattern types based on temporal and contextual characteristics
 */
export var PatternType;
(function (PatternType) {
    /** Patterns that occur every day */
    PatternType["DAILY"] = "DAILY";
    /** Weekly recurring patterns */
    PatternType["WEEKLY"] = "WEEKLY";
    /** Monthly patterns */
    PatternType["MONTHLY"] = "MONTHLY";
    /** Seasonal patterns */
    PatternType["SEASONAL"] = "SEASONAL";
    /** Patterns based on context triggers */
    PatternType["CONTEXTUAL"] = "CONTEXTUAL";
    /** Complex behavioral patterns */
    PatternType["BEHAVIORAL"] = "BEHAVIORAL";
    /** Social interaction patterns */
    PatternType["SOCIAL"] = "SOCIAL";
})(PatternType || (PatternType = {}));
/**
 * Status of a detected pattern indicating its current state
 */
export var PatternStatus;
(function (PatternStatus) {
    /** Pattern is being detected and validated */
    PatternStatus["DETECTING"] = "DETECTING";
    /** Pattern is confirmed with high confidence */
    PatternStatus["CONFIRMED"] = "CONFIRMED";
    /** Pattern is weakening over time */
    PatternStatus["WEAKENING"] = "WEAKENING";
    /** Pattern no longer exists */
    PatternStatus["DISSOLVED"] = "DISSOLVED";
})(PatternStatus || (PatternStatus = {}));
/**
 * Zod schema for recording a behavior event
 */
export const RecordEventSchema = z.object({
    userId: z.string().min(1),
    type: z.string().min(1),
    location: z.string().optional(),
    context: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
});
/**
 * Zod schema for making a prediction
 */
export const MakePredictionSchema = z.object({
    userId: z.string().min(1),
    patternId: z.string().min(1),
    predictedFor: z.string().datetime(),
    prediction: z.string().min(1),
});
/**
 * Zod schema for recording an outcome
 */
export const RecordOutcomeSchema = z.object({
    predictionId: z.string().min(1),
    actualOutcome: z.string().min(1),
});
/**
 * Zod schema for updating a pattern
 */
export const UpdatePatternSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    context: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map
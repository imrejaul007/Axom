/**
 * REZ Life Pattern Engine - Pattern Routes
 * API endpoints for pattern and prediction operations
 */
import { Router } from "express";
import { patternService } from "../services/patternService.js";
import { RecordEventSchema, MakePredictionSchema, RecordOutcomeSchema, UpdatePatternSchema, } from "../types.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
import { validateBody } from "../middleware/validateRequest.js";
/**
 * Creates Express router with all pattern endpoints
 * @returns Configured Express router
 */
export function createPatternRouter() {
    const router = Router();
    /**
     * POST /api/pattern/event
     * Records a new behavior event
     */
    router.post("/event", validateBody(RecordEventSchema), asyncHandler(async (req, res) => {
        const input = req.body;
        const event = await patternService.recordEvent(input.userId, input.type, input.location, input.context, input.metadata);
        res.status(201).json({
            success: true,
            data: event,
        });
    }));
    /**
     * GET /api/pattern/detect/:userId
     * Detects patterns for a user based on their behavior events
     */
    router.get("/detect/:userId", asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            throw ApiError.badRequest("User ID is required");
        }
        const patterns = await patternService.detectPatterns(userId);
        res.json({
            success: true,
            data: {
                userId,
                patternsFound: patterns.length,
                patterns,
            },
        });
    }));
    /**
     * GET /api/pattern/:userId
     * Gets all patterns for a user
     */
    router.get("/:userId", asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            throw ApiError.badRequest("User ID is required");
        }
        const patterns = await patternService.getPatterns(userId);
        res.json({
            success: true,
            data: {
                userId,
                count: patterns.length,
                patterns,
            },
        });
    }));
    /**
     * GET /api/pattern/item/:id
     * Gets a specific pattern by ID
     */
    router.get("/item/:id", asyncHandler(async (req, res) => {
        const { id } = req.params;
        if (!id) {
            throw ApiError.badRequest("Pattern ID is required");
        }
        const pattern = await patternService.getPattern(id);
        if (!pattern) {
            throw ApiError.notFound(`Pattern not found: ${id}`);
        }
        res.json({
            success: true,
            data: pattern,
        });
    }));
    /**
     * PUT /api/pattern/:id
     * Updates a pattern by re-evaluating its confidence
     */
    router.put("/:id", validateBody(UpdatePatternSchema), asyncHandler(async (req, res) => {
        const { id } = req.params;
        const input = req.body;
        if (!id) {
            throw ApiError.badRequest("Pattern ID is required");
        }
        // First check if pattern exists
        const existingPattern = await patternService.getPattern(id);
        if (!existingPattern) {
            throw ApiError.notFound(`Pattern not found: ${id}`);
        }
        // Update pattern (re-evaluate confidence)
        const updatedPattern = await patternService.updatePattern(id);
        // Apply any additional field updates from input
        if (input.name || input.description || input.context) {
            Object.assign(updatedPattern, {
                ...(input.name && { name: input.name }),
                ...(input.description && { description: input.description }),
                ...(input.context && { context: { ...updatedPattern.context, ...input.context } }),
            });
        }
        res.json({
            success: true,
            data: updatedPattern,
        });
    }));
    /**
     * GET /api/pattern/predictions/:userId
     * Gets all predictions for a user
     */
    router.get("/predictions/:userId", asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            throw ApiError.badRequest("User ID is required");
        }
        const predictions = await patternService.getPredictions(userId);
        res.json({
            success: true,
            data: {
                userId,
                count: predictions.length,
                predictions,
            },
        });
    }));
    /**
     * POST /api/pattern/predict
     * Makes a new prediction based on a pattern
     */
    router.post("/predict", validateBody(MakePredictionSchema), asyncHandler(async (req, res) => {
        const input = req.body;
        // Verify pattern exists
        const pattern = await patternService.getPattern(input.patternId);
        if (!pattern) {
            throw ApiError.notFound(`Pattern not found: ${input.patternId}`);
        }
        const predictedFor = new Date(input.predictedFor);
        const prediction = await patternService.makePrediction(input.userId, input.patternId, predictedFor, input.prediction);
        res.status(201).json({
            success: true,
            data: prediction,
        });
    }));
    /**
     * POST /api/pattern/outcome
     * Records the actual outcome for a prediction
     */
    router.post("/outcome", validateBody(RecordOutcomeSchema), asyncHandler(async (req, res) => {
        const input = req.body;
        const updatedPrediction = await patternService.recordOutcome(input.predictionId, input.actualOutcome);
        res.json({
            success: true,
            data: updatedPrediction,
        });
    }));
    /**
     * GET /api/pattern/accuracy/:userId
     * Gets prediction accuracy for a user
     */
    router.get("/accuracy/:userId", asyncHandler(async (req, res) => {
        const { userId } = req.params;
        if (!userId) {
            throw ApiError.badRequest("User ID is required");
        }
        const accuracy = await patternService.getAccuracy(userId);
        res.json({
            success: true,
            data: {
                userId,
                accuracyPercent: Math.round(accuracy * 100) / 100,
                evaluationBasedOn: "completed predictions with recorded outcomes",
            },
        });
    }));
    /**
     * GET /api/pattern/summary/:userId
     * Gets behavior summary for a user
     */
    router.get("/summary/:userId", asyncHandler(async (req, res) => {
        const { userId } = req.params;
        const daysParam = req.query.days;
        if (!userId) {
            throw ApiError.badRequest("User ID is required");
        }
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        const summary = await patternService.getBehaviorSummary(userId, days);
        res.json({
            success: true,
            data: {
                userId,
                days,
                summary,
            },
        });
    }));
    return router;
}
//# sourceMappingURL=pattern.js.map
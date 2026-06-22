import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { cosmicTwinService } from "../services/cosmicTwinService.js";
import { TwinStatus, TwinCapability } from "../types.js";
import { AppError, validateRequest } from "../middleware/index.js";

const router = Router();

/**
 * POST /api/twin/create
 * Creates a new digital twin for a user.
 */
router.post(
  "/create",
  validateRequest(
    z.object({
      userId: z.string().min(1, "userId is required"),
      name: z.string().min(1, "name is required"),
      description: z.string().default(""),
    }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, name, description } = req.body;
      const twin = await cosmicTwinService.create(userId, name, description);
      res.status(201).json({ data: twin });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/twin/:id
 * Retrieves a twin by its unique ID.
 */
router.get(
  "/:id",
  validateRequest(
    z.object({ id: z.string().uuid() }),
    "params"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const twin = await cosmicTwinService.get(req.params.id);
      if (!twin) {
        throw new AppError(404, `Twin with ID "${req.params.id}" not found`);
      }
      res.json({ data: twin });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/twin/user/:userId
 * Retrieves the twin associated with a user ID.
 */
router.get(
  "/user/:userId",
  validateRequest(
    z.object({ userId: z.string().min(1) }),
    "params"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const twin = await cosmicTwinService.getByUserId(req.params.userId);
      if (!twin) {
        throw new AppError(
          404,
          `No twin found for user "${req.params.userId}"`
        );
      }
      res.json({ data: twin });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/twin/:id
 * Updates mutable properties of an existing twin.
 */
router.put(
  "/:id",
  validateRequest(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      personality: z.record(z.unknown()).optional(),
      capabilities: z.array(z.nativeEnum(TwinCapability)).optional(),
    }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const twin = await cosmicTwinService.update(req.params.id, {
        name: req.body.name,
        description: req.body.description,
        personality: req.body.personality,
        capabilities: req.body.capabilities,
      });
      res.json({ data: twin });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/twin/:id/sync
 * Synchronizes data into the twin and creates a sync record.
 */
router.post(
  "/:id/sync",
  validateRequest(
    z.object({
      id: z.string().uuid(),
      data: z.unknown(),
    }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const syncRecord = await cosmicTwinService.sync(
        req.params.id,
        req.body.data
      );
      res.status(201).json({ data: syncRecord });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/twin/:id/capability
 * Adds a capability to the twin's capability list.
 */
router.post(
  "/:id/capability",
  validateRequest(
    z.object({
      id: z.string().uuid(),
      capability: z.nativeEnum(TwinCapability),
    }),
    "body"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const twin = await cosmicTwinService.addCapability(
        req.params.id,
        req.body.capability
      );
      res.json({ data: twin });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/twin/:id/sync
 * Retrieves the full sync history for a twin.
 */
router.get(
  "/:id/sync",
  validateRequest(
    z.object({ id: z.string().uuid() }),
    "params"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await cosmicTwinService.getSyncHistory(req.params.id);
      res.json({ data: history });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/twin/status/:status
 * Retrieves all twins with the given status.
 */
router.get(
  "/status/:status",
  validateRequest(
    z.object({ status: z.nativeEnum(TwinStatus) }),
    "params"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const twins = await cosmicTwinService.getByStatus(
        req.params.status as TwinStatus
      );
      res.json({ data: twins });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/twin/:id/learning
 * Returns the current learning progress percentage.
 */
router.get(
  "/:id/learning",
  validateRequest(
    z.object({ id: z.string().uuid() }),
    "params"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await cosmicTwinService.getLearningProgress(
        req.params.id
      );
      res.json({ data: { twinId: req.params.id, progress } });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/twin/:id
 * Permanently deletes a twin and its sync history.
 */
router.delete(
  "/:id",
  validateRequest(
    z.object({ id: z.string().uuid() }),
    "params"
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await cosmicTwinService.delete(req.params.id);
      if (!deleted) {
        throw new AppError(
          404,
          `Twin with ID "${req.params.id}" not found`
        );
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;

/**
 * Context Graph API Routes.
 * @module routes/contextGraph
 */

import { Router } from 'express';
import { z } from 'zod';
import type { Request, Response } from 'express';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { getContextGraphService } from '../services/contextGraphService.js';
import { RelationshipType } from '../types.js';

/**
 * Express router for context graph endpoints.
 */
const router = Router();

// ============================================
// REQUEST SCHEMAS
// ============================================

/** Schema for creating a new node */
const createNodeSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  label: z.string().min(1, 'label is required'),
  type: z.string().min(1, 'type is required'),
  properties: z.record(z.unknown()).optional().default({}),
  metadata: z.record(z.unknown()).optional().default({}),
});

/** Schema for creating a new edge */
const createEdgeSchema = z.object({
  sourceId: z.string().min(1, 'sourceId is required'),
  targetId: z.string().min(1, 'targetId is required'),
  relationship: z.nativeEnum(RelationshipType),
  strength: z.number().min(1).max(10).optional().default(5),
  context: z.array(z.string()).optional().default([]),
});

/** Schema for updating interaction */
const updateInteractionSchema = z.object({
  nodeId1: z.string().min(1, 'nodeId1 is required'),
  nodeId2: z.string().min(1, 'nodeId2 is required'),
});

/** Schema for relationship query */
const relationshipQuerySchema = z.object({
  userId1: z.string().min(1, 'userId1 is required'),
  userId2: z.string().min(1, 'userId2 is required'),
});

/** Schema for connections query */
const connectionsQuerySchema = z.object({
  depth: z.coerce.number().min(1).max(10).optional().default(1),
});

// ============================================
// NODE ROUTES
// ============================================

/**
 * POST /api/graph/node
 * Creates a new context node.
 */
router.post('/node', asyncHandler(async (req: Request, res: Response) => {
  const validated = createNodeSchema.parse(req.body);
  const service = getContextGraphService();

  const node = await service.addNode(
    validated.userId,
    validated.label,
    validated.type,
    validated.properties
  );

  res.status(201).json({
    success: true,
    data: node,
  });
}));

/**
 * GET /api/graph/node/:id
 * Retrieves a node by ID.
 */
router.get('/node/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const service = getContextGraphService();

  const node = await service.getNode(id);

  if (!node) {
    throw new NotFoundError('Node');
  }

  res.json({
    success: true,
    data: node,
  });
}));

/**
 * GET /api/graph/nodes/:userId
 * Retrieves all nodes for a user.
 */
router.get('/nodes/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const service = getContextGraphService();

  const nodes = await service.getNodesByUser(userId);

  res.json({
    success: true,
    data: nodes,
  });
}));

/**
 * DELETE /api/graph/node/:id
 * Removes a node and its connected edges.
 */
router.delete('/node/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const service = getContextGraphService();

  const removed = await service.removeNode(id);

  if (!removed) {
    throw new NotFoundError('Node');
  }

  res.json({
    success: true,
    data: { deleted: true },
  });
}));

// ============================================
// EDGE ROUTES
// ============================================

/**
 * POST /api/graph/edge
 * Creates a new relationship edge.
 */
router.post('/edge', asyncHandler(async (req: Request, res: Response) => {
  const validated = createEdgeSchema.parse(req.body);
  const service = getContextGraphService();

  try {
    const edge = await service.addEdge(
      validated.sourceId,
      validated.targetId,
      validated.relationship,
      validated.strength,
      validated.context
    );

    res.status(201).json({
      success: true,
      data: edge,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError('Source or target node');
    }
    throw error;
  }
}));

/**
 * GET /api/graph/edges/:nodeId
 * Retrieves all edges connected to a node.
 */
router.get('/edges/:nodeId', asyncHandler(async (req: Request, res: Response) => {
  const { nodeId } = req.params;
  const service = getContextGraphService();

  const edges = await service.getEdges(nodeId);

  res.json({
    success: true,
    data: edges,
  });
}));

/**
 * GET /api/graph/relationship
 * Gets the relationship between two users.
 */
router.get('/relationship', asyncHandler(async (req: Request, res: Response) => {
  const validated = relationshipQuerySchema.parse(req.query);
  const service = getContextGraphService();

  const relationship = await service.getRelationship(
    validated.userId1,
    validated.userId2
  );

  res.json({
    success: true,
    data: relationship,
  });
}));

// ============================================
// GRAPH ROUTES
// ============================================

/**
 * GET /api/graph/:userId
 * Retrieves the complete graph for a user.
 */
router.get('/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const service = getContextGraphService();

  const graph = await service.getGraph(userId);

  res.json({
    success: true,
    data: graph,
  });
}));

/**
 * GET /api/graph/connections/:userId
 * Gets connections up to a specified depth.
 */
router.get('/connections/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const validated = connectionsQuerySchema.parse(req.query);
  const service = getContextGraphService();

  const connections = await service.getConnections(userId, validated.depth);

  res.json({
    success: true,
    data: connections,
  });
}));

/**
 * GET /api/graph/insights/:userId
 * Generates insights for a user's graph.
 */
router.get('/insights/:userId', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const service = getContextGraphService();

  const insights = await service.getInsights(userId);

  res.json({
    success: true,
    data: insights,
  });
}));

// ============================================
// INTERACTION ROUTES
// ============================================

/**
 * PUT /api/graph/interaction
 * Updates the last interaction timestamp between two nodes.
 */
router.put('/interaction', asyncHandler(async (req: Request, res: Response) => {
  const validated = updateInteractionSchema.parse(req.body);
  const service = getContextGraphService();

  await service.updateInteraction(validated.nodeId1, validated.nodeId2);

  res.json({
    success: true,
    data: { updated: true },
  });
}));

export default router;

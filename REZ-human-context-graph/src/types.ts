/**
 * Type definitions for the REZ Human Context Graph service.
 * @module types
 */

/**
 * Enumeration of relationship types between users in the graph.
 */
export enum RelationshipType {
  /** Family relationships (parent, child, sibling, etc.) */
  FAMILY = 'FAMILY',
  /** Social friendships */
  FRIEND = 'FRIEND',
  /** Work-related relationships */
  COLLEAGUE = 'COLLEAGUE',
  /** Casual acquaintances */
  ACQUAINTANCE = 'ACQUAINTANCE',
  /** Mentorship relationships */
  MENTOR = 'MENTOR',
  /** Student relationships */
  STUDENT = 'STUDENT',
  /** Romantic or partnership relationships */
  PARTNER = 'PARTNER',
  /** Neighboring relationships */
  NEIGHBOR = 'NEIGHBOR',
}

/**
 * A context node represents an entity (typically a user) in the graph.
 * Nodes can represent individuals, groups, or any entity with context.
 */
export interface ContextNode {
  /** Unique identifier for the node */
  id: string;
  /** The user ID this node belongs to */
  userId: string;
  /** Human-readable label for the node */
  label: string;
  /** Type/category of the node */
  type: string;
  /** Additional properties as key-value pairs */
  properties: Record<string, unknown>;
  /** Timestamp of last activity */
  lastActive: Date;
  /** Additional metadata about the node */
  metadata: Record<string, unknown>;
}

/**
 * An edge represents a relationship between two context nodes.
 * Edges are directional but can represent bidirectional relationships.
 */
export interface ContextEdge {
  /** Unique identifier for the edge */
  id: string;
  /** Source node ID */
  sourceId: string;
  /** Target node ID */
  targetId: string;
  /** Type of relationship */
  relationship: RelationshipType;
  /** Strength of the relationship (1-10 scale) */
  strength: number;
  /** Context tags describing the relationship */
  context: string[];
  /** When the relationship was established */
  establishedAt: Date;
  /** Timestamp of last interaction */
  lastInteraction: Date;
}

/**
 * A complete context graph containing nodes and edges for a user.
 */
export interface ContextGraph {
  /** All nodes in the graph */
  nodes: ContextNode[];
  /** All edges in the graph */
  edges: ContextEdge[];
}

/**
 * A derived insight from analyzing the context graph.
 */
export interface GraphInsight {
  /** Type of insight detected */
  type: string;
  /** Human-readable description of the insight */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Related user IDs */
  relatedUsers: string[];
  /** Raw data supporting the insight */
  data: Record<string, unknown>;
}

/**
 * Request body for creating a new context node.
 */
export interface CreateNodeRequest {
  userId: string;
  label: string;
  type: string;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Request body for creating a new context edge.
 */
export interface CreateEdgeRequest {
  sourceId: string;
  targetId: string;
  relationship: RelationshipType;
  strength?: number;
  context?: string[];
}

/**
 * Request body for updating interaction between nodes.
 */
export interface UpdateInteractionRequest {
  nodeId1: string;
  nodeId2: string;
}

/**
 * Response format for graph operations.
 */
export interface GraphResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Error response format.
 */
export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

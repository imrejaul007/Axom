/**
 * Context Graph Service - manages nodes, edges, and graph operations.
 * @module services/contextGraphService
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ContextNode,
  ContextEdge,
  ContextGraph,
  GraphInsight,
  RelationshipType,
} from '../types.js';

/**
 * Context Graph Service class managing in-memory graph storage.
 * Provides methods for node/edge management and graph analysis.
 */
export class ContextGraphService {
  /** In-memory storage for nodes: nodeId -> ContextNode */
  private nodes: Map<string, ContextNode> = new Map();

  /** In-memory storage for edges: edgeId -> ContextEdge */
  private edges: Map<string, ContextEdge> = new Map();

  /** Index: userId -> Set of nodeIds */
  private userNodes: Map<string, Set<string>> = new Map();

  /** Index: nodeId -> Set of edgeIds (as source) */
  private nodeEdges: Map<string, Set<string>> = new Map();

  /**
   * Adds a new context node to the graph.
   * @param userId - User ID this node belongs to
   * @param label - Human-readable label
   * @param type - Node type/category
   * @param properties - Additional properties
   * @returns Promise resolving to the created ContextNode
   */
  async addNode(
    userId: string,
    label: string,
    type: string,
    properties: Record<string, unknown> = {}
  ): Promise<ContextNode> {
    const node: ContextNode = {
      id: uuidv4(),
      userId,
      label,
      type,
      properties,
      lastActive: new Date(),
      metadata: {},
    };

    this.nodes.set(node.id, node);

    // Update user index
    if (!this.userNodes.has(userId)) {
      this.userNodes.set(userId, new Set());
    }
    this.userNodes.get(userId)!.add(node.id);

    return node;
  }

  /**
   * Retrieves a node by its ID.
   * @param nodeId - The node ID to look up
   * @returns Promise resolving to the node or null if not found
   */
  async getNode(nodeId: string): Promise<ContextNode | null> {
    return this.nodes.get(nodeId) || null;
  }

  /**
   * Retrieves all nodes belonging to a user.
   * @param userId - The user ID to filter by
   * @returns Promise resolving to array of ContextNodes
   */
  async getNodesByUser(userId: string): Promise<ContextNode[]> {
    const nodeIds = this.userNodes.get(userId);
    if (!nodeIds) {
      return [];
    }

    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter((node): node is ContextNode => node !== undefined);
  }

  /**
   * Adds a new edge connecting two nodes.
   * @param sourceId - Source node ID
   * @param targetId - Target node ID
   * @param relationship - Relationship type
   * @param strength - Relationship strength (1-10, default 5)
   * @param context - Context tags for the relationship
   * @returns Promise resolving to the created ContextEdge
   * @throws Error if source or target node not found
   */
  async addEdge(
    sourceId: string,
    targetId: string,
    relationship: RelationshipType,
    strength: number = 5,
    context: string[] = []
  ): Promise<ContextEdge> {
    // Validate nodes exist
    if (!this.nodes.has(sourceId)) {
      throw new Error(`Source node ${sourceId} not found`);
    }
    if (!this.nodes.has(targetId)) {
      throw new Error(`Target node ${targetId} not found`);
    }

    const edge: ContextEdge = {
      id: uuidv4(),
      sourceId,
      targetId,
      relationship,
      strength: Math.min(10, Math.max(1, strength)),
      context,
      establishedAt: new Date(),
      lastInteraction: new Date(),
    };

    this.edges.set(edge.id, edge);

    // Update node edges index
    if (!this.nodeEdges.has(sourceId)) {
      this.nodeEdges.set(sourceId, new Set());
    }
    this.nodeEdges.get(sourceId)!.add(edge.id);

    if (!this.nodeEdges.has(targetId)) {
      this.nodeEdges.set(targetId, new Set());
    }
    this.nodeEdges.get(targetId)!.add(edge.id);

    return edge;
  }

  /**
   * Retrieves all edges connected to a node.
   * @param nodeId - The node ID
   * @returns Promise resolving to array of ContextEdges
   */
  async getEdges(nodeId: string): Promise<ContextEdge[]> {
    const edgeIds = this.nodeEdges.get(nodeId);
    if (!edgeIds) {
      return [];
    }

    return Array.from(edgeIds)
      .map(id => this.edges.get(id))
      .filter((edge): edge is ContextEdge => edge !== undefined);
  }

  /**
   * Gets the relationship between two users by traversing their nodes.
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   * @returns Promise resolving to the ContextEdge or null if no relationship exists
   */
  async getRelationship(userId1: string, userId2: string): Promise<ContextEdge | null> {
    // Get nodes for both users
    const nodes1 = await this.getNodesByUser(userId1);
    const nodes2 = await this.getNodesByUser(userId2);

    if (nodes1.length === 0 || nodes2.length === 0) {
      return null;
    }

    // Find edge between any node from user1 and any node from user2
    for (const node1 of nodes1) {
      const edges = await this.getEdges(node1.id);
      for (const edge of edges) {
        const otherNodeId = edge.sourceId === node1.id ? edge.targetId : edge.sourceId;
        const otherNode = this.nodes.get(otherNodeId);
        if (otherNode && nodes2.some(n => n.id === otherNodeId)) {
          return edge;
        }
      }
    }

    return null;
  }

  /**
   * Retrieves the complete graph for a user.
   * @param userId - The user ID
   * @returns Promise resolving to ContextGraph with nodes and edges
   */
  async getGraph(userId: string): Promise<ContextGraph> {
    const nodes = await this.getNodesByUser(userId);
    const edges: ContextEdge[] = [];

    // Collect all edges for all nodes
    for (const node of nodes) {
      const nodeEdges = await this.getEdges(node.id);
      for (const edge of nodeEdges) {
        // Include edge if target is also in user's nodes
        const targetNode = this.nodes.get(edge.targetId);
        if (targetNode && nodes.some(n => n.id === edge.targetId)) {
          // Avoid duplicates
          if (!edges.some(e => e.id === edge.id)) {
            edges.push(edge);
          }
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Gets connections for a user up to a specified depth.
   * @param userId - The user ID
   * @param depth - Maximum traversal depth (default: 1)
   * @returns Promise resolving to array of connected ContextNodes
   */
  async getConnections(userId: string, depth: number = 1): Promise<ContextNode[]> {
    const visited = new Set<string>();
    const result: ContextNode[] = [];
    const userNodes = await this.getNodesByUser(userId);

    if (userNodes.length === 0) {
      return [];
    }

    // BFS traversal
    const queue: Array<{ nodeId: string; currentDepth: number }> = userNodes.map(n => ({
      nodeId: n.id,
      currentDepth: 0,
    }));

    while (queue.length > 0) {
      const { nodeId, currentDepth } = queue.shift()!;

      if (visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);

      if (currentDepth > 0 && nodeId !== userNodes[0].id) {
        const node = this.nodes.get(nodeId);
        if (node && !result.some(n => n.id === nodeId)) {
          result.push(node);
        }
      }

      if (currentDepth < depth) {
        const edges = await this.getEdges(nodeId);
        for (const edge of edges) {
          const neighborId = edge.targetId === nodeId ? edge.sourceId : edge.targetId;
          if (!visited.has(neighborId)) {
            queue.push({ nodeId: neighborId, currentDepth: currentDepth + 1 });
          }
        }
      }
    }

    return result;
  }

  /**
   * Generates insights about a user's graph.
   * @param userId - The user ID
   * @returns Promise resolving to array of GraphInsights
   */
  async getInsights(userId: string): Promise<GraphInsight[]> {
    const insights: GraphInsight[] = [];
    const nodes = await this.getNodesByUser(userId);

    if (nodes.length === 0) {
      return insights;
    }

    // Calculate relationship statistics
    const relationshipCounts = new Map<RelationshipType, number>();
    const connectionStrengths: number[] = [];

    for (const node of nodes) {
      const edges = await this.getEdges(node.id);
      for (const edge of edges) {
        const count = relationshipCounts.get(edge.relationship) || 0;
        relationshipCounts.set(edge.relationship, count + 1);
        connectionStrengths.push(edge.strength);
      }
    }

    // Insight: Dominant relationship type
    if (relationshipCounts.size > 0) {
      const dominant = [...relationshipCounts.entries()].reduce((a, b) =>
        b[1] > a[1] ? b : a
      );

      insights.push({
        type: 'dominant_relationship',
        description: `Most common relationship type is ${dominant[0]}`,
        confidence: Math.min(1, dominant[1] / 10),
        relatedUsers: [],
        data: {
          relationshipType: dominant[0],
          count: dominant[1],
          allTypes: Object.fromEntries(relationshipCounts),
        },
      });
    }

    // Insight: Connection strength analysis
    if (connectionStrengths.length > 0) {
      const avgStrength = connectionStrengths.reduce((a, b) => a + b, 0) / connectionStrengths.length;
      const strongConnections = connectionStrengths.filter(s => s >= 7).length;

      insights.push({
        type: 'connection_strength',
        description: avgStrength >= 7
          ? 'Strong overall relationship network'
          : avgStrength >= 4
          ? 'Moderate relationship network'
          : 'Developing relationship network',
        confidence: 0.8,
        relatedUsers: [],
        data: {
          averageStrength: avgStrength,
          strongConnections,
          totalConnections: connectionStrengths.length,
        },
      });
    }

    // Insight: Graph density
    const graph = await this.getGraph(userId);
    const maxEdges = (nodes.length * (nodes.length - 1)) / 2;
    const density = maxEdges > 0 ? graph.edges.length / maxEdges : 0;

    insights.push({
      type: 'graph_density',
      description: density > 0.5
        ? 'Highly connected network'
        : density > 0.2
        ? 'Moderately connected network'
        : 'Sparse network',
      confidence: 0.7,
      relatedUsers: [],
      data: {
        density,
        nodeCount: nodes.length,
        edgeCount: graph.edges.length,
        maxPossibleEdges: maxEdges,
      },
    });

    // Insight: Active relationships (recent interactions)
    const recentEdges = graph.edges.filter(e => {
      const daysSince = (Date.now() - e.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    });

    if (recentEdges.length > 0) {
      insights.push({
        type: 'active_relationships',
        description: `${recentEdges.length} relationships active in the last 30 days`,
        confidence: 0.9,
        relatedUsers: [],
        data: {
          activeCount: recentEdges.length,
          totalCount: graph.edges.length,
          percentage: (recentEdges.length / graph.edges.length) * 100,
        },
      });
    }

    return insights;
  }

  /**
   * Removes a node and all its connected edges.
   * @param nodeId - The node ID to remove
   * @returns Promise resolving to true if removed, false if not found
   */
  async removeNode(nodeId: string): Promise<boolean> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }

    // Remove all connected edges
    const edges = await this.getEdges(nodeId);
    for (const edge of edges) {
      this.edges.delete(edge.id);
    }

    // Clean up node edges index
    this.nodeEdges.delete(nodeId);

    // Remove from user index
    const userNodeSet = this.userNodes.get(node.userId);
    if (userNodeSet) {
      userNodeSet.delete(nodeId);
      if (userNodeSet.size === 0) {
        this.userNodes.delete(node.userId);
      }
    }

    // Remove node
    this.nodes.delete(nodeId);

    return true;
  }

  /**
   * Updates the last interaction timestamp between two nodes.
   * @param nodeId1 - First node ID
   * @param nodeId2 - Second node ID
   */
  async updateInteraction(nodeId1: string, nodeId2: string): Promise<void> {
    const now = new Date();

    // Find and update edges between these nodes
    for (const [edgeId, edge] of this.edges) {
      if (
        (edge.sourceId === nodeId1 && edge.targetId === nodeId2) ||
        (edge.sourceId === nodeId2 && edge.targetId === nodeId1)
      ) {
        const updatedEdge = { ...edge, lastInteraction: now };
        this.edges.set(edgeId, updatedEdge);
      }
    }

    // Update lastActive for both nodes
    const node1 = this.nodes.get(nodeId1);
    const node2 = this.nodes.get(nodeId2);

    if (node1) {
      this.nodes.set(nodeId1, { ...node1, lastActive: now });
    }
    if (node2) {
      this.nodes.set(nodeId2, { ...node2, lastActive: now });
    }
  }

  /**
   * Clears all data from the service (useful for testing).
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.userNodes.clear();
    this.nodeEdges.clear();
  }

  /**
   * Gets the total count of nodes (useful for testing).
   * @returns Total number of nodes
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Gets the total count of edges (useful for testing).
   * @returns Total number of edges
   */
  getEdgeCount(): number {
    return this.edges.size;
  }
}

/** Singleton instance */
let serviceInstance: ContextGraphService | null = null;

/**
 * Gets the singleton instance of ContextGraphService.
 * @returns The ContextGraphService singleton
 */
export function getContextGraphService(): ContextGraphService {
  if (!serviceInstance) {
    serviceInstance = new ContextGraphService();
  }
  return serviceInstance;
}

/**
 * Resets the singleton instance (useful for testing).
 */
export function resetContextGraphService(): void {
  serviceInstance = null;
}
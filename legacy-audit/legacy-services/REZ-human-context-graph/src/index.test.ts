/**
 * Unit tests for ContextGraphService.
 * @module index.test
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  ContextGraphService,
  getContextGraphService,
  resetContextGraphService,
} from './services/contextGraphService.js';
import { RelationshipType } from './types.js';

describe('ContextGraphService', () => {
  let service: ContextGraphService;

  beforeEach(() => {
    resetContextGraphService();
    service = getContextGraphService();
  });

  afterEach(() => {
    service.clear();
  });

  describe('addNode', () => {
    it('should add a node successfully', async () => {
      const node = await service.addNode('user1', 'John Doe', 'person', { age: 30 });

      expect(node).toBeDefined();
      expect(node.id).toBeDefined();
      expect(node.userId).toBe('user1');
      expect(node.label).toBe('John Doe');
      expect(node.type).toBe('person');
      expect(node.properties).toEqual({ age: 30 });
      expect(node.lastActive).toBeInstanceOf(Date);
      expect(node.metadata).toEqual({});
    });

    it('should create unique IDs for each node', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user1', 'Node 2', 'type');

      expect(node1.id).not.toBe(node2.id);
    });

    it('should increment node count', async () => {
      expect(service.getNodeCount()).toBe(0);

      await service.addNode('user1', 'Node 1', 'type');
      await service.addNode('user1', 'Node 2', 'type');

      expect(service.getNodeCount()).toBe(2);
    });
  });

  describe('getNode', () => {
    it('should retrieve a node by ID', async () => {
      const created = await service.addNode('user1', 'Test Node', 'type');

      const retrieved = await service.getNode(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.label).toBe('Test Node');
    });

    it('should return null for non-existent node', async () => {
      const node = await service.getNode('non-existent-id');

      expect(node).toBeNull();
    });
  });

  describe('getNodesByUser', () => {
    it('should retrieve all nodes for a user', async () => {
      await service.addNode('user1', 'Node 1', 'type');
      await service.addNode('user1', 'Node 2', 'type');
      await service.addNode('user2', 'Other User Node', 'type');

      const nodes = await service.getNodesByUser('user1');

      expect(nodes).toHaveLength(2);
      expect(nodes.every(n => n.userId === 'user1')).toBe(true);
    });

    it('should return empty array for user with no nodes', async () => {
      const nodes = await service.getNodesByUser('non-existent-user');

      expect(nodes).toEqual([]);
    });
  });

  describe('addEdge', () => {
    it('should add an edge between two nodes', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');

      const edge = await service.addEdge(
        node1.id,
        node2.id,
        RelationshipType.FRIEND,
        8,
        ['work', 'gym']
      );

      expect(edge).toBeDefined();
      expect(edge.id).toBeDefined();
      expect(edge.sourceId).toBe(node1.id);
      expect(edge.targetId).toBe(node2.id);
      expect(edge.relationship).toBe(RelationshipType.FRIEND);
      expect(edge.strength).toBe(8);
      expect(edge.context).toEqual(['work', 'gym']);
      expect(edge.establishedAt).toBeInstanceOf(Date);
      expect(edge.lastInteraction).toBeInstanceOf(Date);
    });

    it('should clamp strength between 1 and 10', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');

      const edge1 = await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND, 15);
      const edge2 = await service.addEdge(node1.id, node2.id, RelationshipType.FAMILY, 0);

      expect(edge1.strength).toBe(10);
      expect(edge2.strength).toBe(1);
    });

    it('should throw error for non-existent source node', async () => {
      const node = await service.addNode('user1', 'Node', 'type');

      await expect(
        service.addEdge('non-existent', node.id, RelationshipType.FRIEND)
      ).rejects.toThrow('Source node non-existent not found');
    });

    it('should throw error for non-existent target node', async () => {
      const node = await service.addNode('user1', 'Node', 'type');

      await expect(
        service.addEdge(node.id, 'non-existent', RelationshipType.FRIEND)
      ).rejects.toThrow('Target node non-existent not found');
    });

    it('should increment edge count', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');
      const node3 = await service.addNode('user3', 'Node 3', 'type');

      expect(service.getEdgeCount()).toBe(0);

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);
      await service.addEdge(node2.id, node3.id, RelationshipType.COLLEAGUE);

      expect(service.getEdgeCount()).toBe(2);
    });
  });

  describe('getEdges', () => {
    it('should retrieve all edges for a node', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');
      const node3 = await service.addNode('user3', 'Node 3', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);
      await service.addEdge(node1.id, node3.id, RelationshipType.COLLEAGUE);

      const edges = await service.getEdges(node1.id);

      expect(edges).toHaveLength(2);
    });

    it('should return empty array for node with no edges', async () => {
      const node = await service.addNode('user1', 'Node', 'type');

      const edges = await service.getEdges(node.id);

      expect(edges).toEqual([]);
    });
  });

  describe('getRelationship', () => {
    it('should find relationship between two users', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND, 7);

      const relationship = await service.getRelationship('user1', 'user2');

      expect(relationship).toBeDefined();
      expect(relationship?.relationship).toBe(RelationshipType.FRIEND);
      expect(relationship?.strength).toBe(7);
    });

    it('should return null when no relationship exists', async () => {
      const relationship = await service.getRelationship('user1', 'user2');

      expect(relationship).toBeNull();
    });
  });

  describe('getGraph', () => {
    it('should retrieve complete graph for a user', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user1', 'Node 2', 'type');
      const node3 = await service.addNode('user2', 'Node 3', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);
      await service.addEdge(node1.id, node3.id, RelationshipType.COLLEAGUE);

      const graph = await service.getGraph('user1');

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1); // Only edge within user1's nodes
    });

    it('should return empty graph for user with no nodes', async () => {
      const graph = await service.getGraph('non-existent');

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });
  });

  describe('getConnections', () => {
    it('should find direct connections at depth 1', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');
      const node3 = await service.addNode('user3', 'Node 3', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);
      await service.addEdge(node2.id, node3.id, RelationshipType.FRIEND);

      const connections = await service.getConnections('user1', 1);

      expect(connections).toHaveLength(1);
      expect(connections[0].id).toBe(node2.id);
    });

    it('should find connections at multiple depths', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');
      const node3 = await service.addNode('user3', 'Node 3', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);
      await service.addEdge(node2.id, node3.id, RelationshipType.FRIEND);

      const connections = await service.getConnections('user1', 2);

      expect(connections.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getInsights', () => {
    it('should generate insights for a user with connections', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');
      const node3 = await service.addNode('user3', 'Node 3', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND, 8);
      await service.addEdge(node1.id, node3.id, RelationshipType.FAMILY, 6);

      const insights = await service.getInsights('user1');

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].type).toBeDefined();
      expect(insights[0].description).toBeDefined();
      expect(insights[0].confidence).toBeDefined();
    });

    it('should return empty insights for user with no nodes', async () => {
      const insights = await service.getInsights('non-existent');

      expect(insights).toEqual([]);
    });

    it('should detect dominant relationship type', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');
      const node3 = await service.addNode('user3', 'Node 3', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);
      await service.addEdge(node1.id, node3.id, RelationshipType.FRIEND);

      const insights = await service.getInsights('user1');
      const dominantInsight = insights.find(i => i.type === 'dominant_relationship');

      expect(dominantInsight).toBeDefined();
      expect(dominantInsight?.data).toHaveProperty('relationshipType', 'FRIEND');
    });
  });

  describe('removeNode', () => {
    it('should remove a node and its edges', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);

      const result = await service.removeNode(node1.id);

      expect(result).toBe(true);
      expect(await service.getNode(node1.id)).toBeNull();
      expect((await service.getEdges(node1.id)).length).toBe(0);
    });

    it('should return false for non-existent node', async () => {
      const result = await service.removeNode('non-existent');

      expect(result).toBe(false);
    });

    it('should decrement node count', async () => {
      const node = await service.addNode('user1', 'Node', 'type');
      expect(service.getNodeCount()).toBe(1);

      await service.removeNode(node.id);

      expect(service.getNodeCount()).toBe(0);
    });
  });

  describe('updateInteraction', () => {
    it('should update last interaction timestamp', async () => {
      const node1 = await service.addNode('user1', 'Node 1', 'type');
      const node2 = await service.addNode('user2', 'Node 2', 'type');

      await service.addEdge(node1.id, node2.id, RelationshipType.FRIEND);

      // Wait a small amount to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await service.updateInteraction(node1.id, node2.id);

      const edges = await service.getEdges(node1.id);
      expect(edges[0].lastInteraction.getTime()).toBeGreaterThan(edges[0].establishedAt.getTime());
    });
  });

  describe('clear', () => {
    it('should clear all data', async () => {
      await service.addNode('user1', 'Node 1', 'type');
      await service.addNode('user2', 'Node 2', 'type');

      service.clear();

      expect(service.getNodeCount()).toBe(0);
      expect(service.getEdgeCount()).toBe(0);
    });
  });
});
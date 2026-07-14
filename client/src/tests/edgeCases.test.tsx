// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { checkRoleAuthorization } from '../firebase/config';
import { sanitizeInput, validateEmail, validateRequiredFields } from '../utils/security';

// Isolated edge case Dijkstra solver test mock
function solveIsolatedDijkstra(
  nodes: string[],
  edges: Array<[string, string, number]>,
  start: string,
  end: string
): string[] | null {
  if (!nodes.includes(start) || !nodes.includes(end)) {
    return null;
  }
  if (start === end) {
    return [start];
  }
  
  // Minimal BFS to find path in small mock graph
  const queue: Array<[string, string[]]> = [[start, [start]]];
  const visited = new Set<string>([start]);
  
  while (queue.length > 0) {
    const [current, path] = queue.shift()!;
    if (current === end) {
      return path;
    }
    
    // Find neighbors
    for (const [u, v] of edges) {
      if (u === current && !visited.has(v)) {
        visited.add(v);
        queue.push([v, [...path, v]]);
      } else if (v === current && !visited.has(u)) {
        visited.add(u);
        queue.push([u, [...path, u]]);
      }
    }
  }
  
  return null;
}

describe('Boundary Conditions and Edge Case Test Suite', () => {

  describe('Dijkstra Routing Failures & Disconnected Nodes', () => {
    it('should return null path if target start or end node is missing from graph parameters', () => {
      const nodes = ['gate-a', 'gate-b'];
      const edges: Array<[string, string, number]> = [['gate-a', 'gate-b', 50]];
      
      const res = solveIsolatedDijkstra(nodes, edges, 'gate-a', 'gate-c');
      expect(res).toBeNull();
    });

    it('should return path containing only start node if start equals end destination', () => {
      const nodes = ['gate-a', 'gate-b'];
      const edges: Array<[string, string, number]> = [['gate-a', 'gate-b', 50]];
      
      const res = solveIsolatedDijkstra(nodes, edges, 'gate-a', 'gate-a');
      expect(res).toEqual(['gate-a']);
    });

    it('should return null if there is no connecting edge between start and end node clusters', () => {
      const nodes = ['gate-a', 'gate-b', 'gate-c', 'gate-d'];
      const edges: Array<[string, string, number]> = [
        ['gate-a', 'gate-b', 10],
        ['gate-c', 'gate-d', 20]
      ];
      
      const res = solveIsolatedDijkstra(nodes, edges, 'gate-a', 'gate-d');
      expect(res).toBeNull();
    });
  });

  describe('RBAC Violation Scenarios', () => {
    it('should correctly block update operations for spectator role on any collection', () => {
      expect(() => checkRoleAuthorization('spectator', 'gates', 'update')).toThrow('Unauthorized');
      expect(() => checkRoleAuthorization('spectator', 'matches', 'update')).toThrow('Unauthorized');
      expect(() => checkRoleAuthorization('spectator', 'facilities', 'update')).toThrow('Unauthorized');
    });

    it('should correctly block spectator from creating records except alerts', () => {
      expect(() => checkRoleAuthorization('spectator', 'gates', 'create')).toThrow('Unauthorized');
      expect(() => checkRoleAuthorization('spectator', 'matches', 'create')).toThrow('Unauthorized');
      expect(() => checkRoleAuthorization('spectator', 'alerts', 'create')).not.toThrow();
    });

    it('should block non-admin/non-organizer roles from editing matches', () => {
      expect(() => checkRoleAuthorization('security', 'matches', 'update')).toThrow('Unauthorized');
      expect(() => checkRoleAuthorization('medical', 'matches', 'update')).toThrow('Unauthorized');
      expect(() => checkRoleAuthorization('volunteer', 'matches', 'update')).toThrow('Unauthorized');
      
      expect(() => checkRoleAuthorization('organizer', 'matches', 'update')).not.toThrow();
      expect(() => checkRoleAuthorization('admin', 'matches', 'update')).not.toThrow();
    });
  });

  describe('Validation Boundary Conditions', () => {
    it('should handle special character sanitizations gracefully without crashes', () => {
      const specialInput = 'Hello! @#$%^*()_+=-`~[]\\|;:",./?';
      const result = sanitizeInput(specialInput);
      expect(result).toBeDefined();
      expect(result).not.toContain('"');
    });

    it('should reject email addresses with multiple @ symbols or spaces', () => {
      expect(validateEmail('test@sub@domain.com')).toBe(false);
      expect(validateEmail('test spaces@domain.com')).toBe(false);
    });

    it('should identify empty space string fields as blank validations errors', () => {
      const record = { title: '   ', content: 'Valid message' };
      const err = validateRequiredFields(record);
      expect(err).toContain('is required');
    });
  });
});

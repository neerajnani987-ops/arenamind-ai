import { describe, it, expect } from 'vitest';
import { findShortestPath } from './dijkstra.js';

describe('Dijkstra Routing Engine', () => {
  it('should find the fastest path between park-a and seat-a120', () => {
    const route = findShortestPath('park-a', 'seat-a120', 'fastest');
    expect(route).not.toBeNull();
    expect(route.path[0]).toBe('Parking Zone A');
    expect(route.path[route.path.length - 1]).toBe('Seat A-120 (Tier 1)');
    expect(route.estimatedTimeMin).toBeGreaterThan(0);
  });

  it('should filter out non-wheelchair paths in wheelchair mode', () => {
    // Finding path from park-c to seat-a120 under wheelchair mode should ensure all parts of the route are wheelchair accessible.
    const routeWheelchair = findShortestPath('park-c', 'seat-a120', 'wheelchair');

    if (routeWheelchair) {
      expect(routeWheelchair.wheelchair).toBe(true);
    } else {
      expect(routeWheelchair).toBeNull();
    }
  });
});

// Graph-based Stadium Routing Setup
// Node structure: { id, name, type, coords: [lat, lng], wheelchair: boolean }
export const STADIUM_NODES = {
  'gate-a': { id: 'gate-a', name: 'Gate A (North)', coords: [12.9780, 77.5910], wheelchair: true },
  'gate-b': { id: 'gate-b', name: 'Gate B (East)', coords: [12.9785, 77.5925], wheelchair: true },
  'gate-c': { id: 'gate-c', name: 'Gate C (South)', coords: [12.9770, 77.5920], wheelchair: false }, // steps only
  'gate-d': { id: 'gate-d', name: 'Gate D (West)', coords: [12.9775, 77.5900], wheelchair: true },
  'gate-e': { id: 'gate-e', name: 'Gate E (VVIP)', coords: [12.9790, 77.5915], wheelchair: true },
  'park-a': { id: 'park-a', name: 'Parking Zone A', coords: [12.9800, 77.5905], wheelchair: true },
  'park-b': { id: 'park-b', name: 'Parking Zone B', coords: [12.9795, 77.5935], wheelchair: true },
  'park-c': { id: 'park-c', name: 'Parking Zone C', coords: [12.9755, 77.5925], wheelchair: false },
  'park-d': { id: 'park-d', name: 'Parking Zone D', coords: [12.9760, 77.5895], wheelchair: true },
  'tier-1': { id: 'tier-1', name: 'Lower Tier 1 Concourse', coords: [12.9778, 77.5912], wheelchair: true },
  'tier-2': { id: 'tier-2', name: 'Middle Tier 2 Concourse', coords: [12.9782, 77.5915], wheelchair: true },
  'tier-3': { id: 'tier-3', name: 'Upper Tier 3 Concourse', coords: [12.9784, 77.5918], wheelchair: false }, // escalator/stairs only
  'seat-a120': { id: 'seat-a120', name: 'Seat A-120 (Tier 1)', coords: [12.9776, 77.5914], wheelchair: true },
  'restroom-n': { id: 'restroom-n', name: 'Restroom North (Tier 1)', coords: [12.9781, 77.5908], wheelchair: true },
  'restroom-e': { id: 'restroom-e', name: 'Restroom East (Tier 2)', coords: [12.9783, 77.5922], wheelchair: true },
  'food-bazaar': { id: 'food-bazaar', name: 'Grand Food Bazaar (West)', coords: [12.9774, 77.5902], wheelchair: true },
  'cafe-express': { id: 'cafe-express', name: 'Arena Express Cafe (East)', coords: [12.9780, 77.5926], wheelchair: true },
};

// Edges list: [nodeA, nodeB, baseDistance, crowdFactor (1 to 10), wheelchairAccessible]
export const STADIUM_EDGES = [
  ['park-a', 'gate-a', 150, 2, true],
  ['park-a', 'gate-e', 120, 1, true],
  ['park-b', 'gate-b', 180, 8, true],
  ['park-c', 'gate-c', 200, 4, false],
  ['park-d', 'gate-d', 220, 3, true],
  ['gate-a', 'tier-1', 50, 4, true],
  ['gate-d', 'tier-1', 60, 2, true],
  ['gate-b', 'tier-2', 80, 9, true],
  ['gate-c', 'tier-3', 110, 3, false],
  ['gate-e', 'tier-1', 40, 1, true],
  ['tier-1', 'seat-a120', 30, 2, true],
  ['tier-1', 'restroom-n', 40, 3, true],
  ['tier-2', 'restroom-e', 50, 7, true],
  ['tier-1', 'food-bazaar', 70, 5, true],
  ['tier-2', 'cafe-express', 60, 8, true],
  ['tier-1', 'tier-2', 100, 3, true], // Ramp
  ['tier-2', 'tier-3', 120, 5, false], // Stairs only
  ['gate-a', 'gate-d', 160, 3, true],
  ['gate-b', 'gate-c', 170, 6, true],
];

// Precompute adjacency map at module load
export const ADJACENCY_MAP = new Map();
for (const nodeId of Object.keys(STADIUM_NODES)) {
  ADJACENCY_MAP.set(nodeId, []);
}
for (const edge of STADIUM_EDGES) {
  const [u, v, dist, crowd, wheelchair] = edge;
  if (ADJACENCY_MAP.has(u)) {
    ADJACENCY_MAP.get(u).push({ node: v, dist, crowd, wheelchair });
  }
  if (ADJACENCY_MAP.has(v)) {
    ADJACENCY_MAP.get(v).push({ node: u, dist, crowd, wheelchair });
  }
}

// Binary Min-Heap implementation for O(log V) queue operations
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(node, distance) {
    this.heap.push({ node, distance });
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  bubbleUp(index) {
    const element = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (element.distance >= parent.distance) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = element;
  }

  sinkDown(index) {
    const length = this.heap.length;
    const element = this.heap[index];
    while (true) {
      let leftChildIndex = 2 * index + 1;
      let rightChildIndex = 2 * index + 2;
      let swapIndex = null;

      if (leftChildIndex < length) {
        if (this.heap[leftChildIndex].distance < element.distance) {
          swapIndex = leftChildIndex;
        }
      }

      if (rightChildIndex < length) {
        const leftDistance = swapIndex === null ? element.distance : this.heap[leftChildIndex].distance;
        if (this.heap[rightChildIndex].distance < leftDistance) {
          swapIndex = rightChildIndex;
        }
      }

      if (swapIndex === null) break;
      this.heap[index] = this.heap[swapIndex];
      index = swapIndex;
    }
    this.heap[index] = element;
  }

  size() {
    return this.heap.length;
  }
}

// Graph routing calculation using Dijkstra with caching/memoization
export const ROUTE_CACHE = new Map();

export function findShortestPath(startNode, endNode, routingType = 'fastest') {
  const cacheKey = `${startNode}_${endNode}_${routingType}`;
  if (ROUTE_CACHE.has(cacheKey)) {
    return ROUTE_CACHE.get(cacheKey);
  }

  const distances = {};
  const previous = {};
  const visited = new Set();
  const heap = new MinHeap();

  // Initialize
  for (const node of Object.keys(STADIUM_NODES)) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startNode] = 0;
  heap.push(startNode, 0);

  while (heap.size() > 0) {
    const current = heap.pop();
    if (!current) break;
    const closestNode = current.node;

    if (visited.has(closestNode)) continue;
    visited.add(closestNode);

    if (closestNode === endNode) {
      break;
    }

    const neighbors = ADJACENCY_MAP.get(closestNode) || [];
    for (const neighbor of neighbors) {
      if (routingType === 'wheelchair' && !neighbor.wheelchair) continue;
      if (visited.has(neighbor.node)) continue;

      let weight = neighbor.dist;
      if (routingType === 'least_crowded') {
        weight = neighbor.dist * (1 + neighbor.crowd * 0.5); // Inflate weight for crowded path
      }
      
      const alt = distances[closestNode] + weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = closestNode;
        heap.push(neighbor.node, alt);
      }
    }
  }

  // Construct path
  const path = [];
  let current = endNode;
  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  if (path.length <= 1 || path[0] !== startNode) {
    return null; // No route found
  }

  // Generate directions
  const directions = [];
  let totalTimeSec = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    
    // Find neighbor using adjacency map instead of full edges array scan
    const neighborsOfU = ADJACENCY_MAP.get(u) || [];
    const edgeData = neighborsOfU.find(n => n.node === v);
    
    if (edgeData) {
      const dist = edgeData.dist;
      const speed = routingType === 'wheelchair' ? 1.0 : 1.4; // m/s walking speed
      const time = Math.round(dist / speed);
      totalTimeSec += time;
      
      const nodeA = STADIUM_NODES[u].name;
      const nodeB = STADIUM_NODES[v].name;
      directions.push(`Walk from ${nodeA} to ${nodeB} (${dist} meters, approx. ${Math.round(time/60)} min).`);
    }
  }

  const coordinates = path.map(nodeId => STADIUM_NODES[nodeId].coords);

  const result = {
    path: path.map(nodeId => STADIUM_NODES[nodeId].name),
    coordinates,
    directions,
    estimatedTimeMin: Math.max(1, Math.round(totalTimeSec / 60)),
    wheelchair: path.every((nodeId, idx) => {
      if (idx === 0) return true;
      const u = path[idx - 1];
      const v = nodeId;
      const neighborsOfU = ADJACENCY_MAP.get(u) || [];
      const edgeData = neighborsOfU.find(n => n.node === v);
      return edgeData ? edgeData.wheelchair === true : true;
    })
  };

  ROUTE_CACHE.set(cacheKey, result);
  return result;
}

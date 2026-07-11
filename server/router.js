import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Graph-based Stadium Routing Setup
// Node structure: { id, name, type, coords: [lat, lng], wheelchair: boolean }
const STADIUM_NODES = {
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
const STADIUM_EDGES = [
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

// Graph routing calculation using Dijkstra
function findShortestPath(startNode, endNode, routingType = 'fastest') {
  const distances = {};
  const previous = {};
  const nodes = new Set(Object.keys(STADIUM_NODES));

  // Initialize
  for (const node of nodes) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startNode] = 0;

  while (nodes.size > 0) {
    // Find node with minimum distance
    let closestNode = null;
    for (const node of nodes) {
      if (closestNode === null || distances[node] < distances[closestNode]) {
        closestNode = node;
      }
    }

    if (closestNode === null || distances[closestNode] === Infinity || closestNode === endNode) {
      break;
    }

    nodes.delete(closestNode);

    // Get neighbors
    const neighbors = [];
    for (const edge of STADIUM_EDGES) {
      const [u, v, dist, crowd, wheelchair] = edge;
      if (routingType === 'wheelchair' && !wheelchair) continue;

      if (u === closestNode && nodes.has(v)) {
        neighbors.push({ node: v, dist, crowd });
      } else if (v === closestNode && nodes.has(u)) {
        neighbors.push({ node: u, dist, crowd });
      }
    }

    for (const neighbor of neighbors) {
      let weight = neighbor.dist;
      if (routingType === 'least_crowded') {
        weight = neighbor.dist * (1 + neighbor.crowd * 0.5); // Inflate weight for crowded path
      }
      
      const alt = distances[closestNode] + weight;
      if (alt < distances[neighbor.node]) {
        distances[neighbor.node] = alt;
        previous[neighbor.node] = closestNode;
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
    const edge = STADIUM_EDGES.find(
      e => (e[0] === u && e[1] === v) || (e[0] === v && e[1] === u)
    );
    
    if (edge) {
      const dist = edge[2];
      const speed = routingType === 'wheelchair' ? 1.0 : 1.4; // m/s walking speed
      const time = Math.round(dist / speed);
      totalTimeSec += time;
      
      const nodeA = STADIUM_NODES[u].name;
      const nodeB = STADIUM_NODES[v].name;
      directions.push(`Walk from ${nodeA} to ${nodeB} (${dist} meters, approx. ${Math.round(time/60)} min).`);
    }
  }

  const coordinates = path.map(nodeId => STADIUM_NODES[nodeId].coords);

  return {
    path: path.map(nodeId => STADIUM_NODES[nodeId].name),
    coordinates,
    directions,
    estimatedTimeMin: Math.max(1, Math.round(totalTimeSec / 60)),
    wheelchair: path.every((nodeId, idx) => {
      if (idx === 0) return true;
      const u = path[idx - 1];
      const v = nodeId;
      const edge = STADIUM_EDGES.find(e => (e[0] === u && e[1] === v) || (e[0] === v && e[1] === u));
      return edge ? edge[4] === true : true;
    })
  };
}

// ----------------------------------------------------
// Multilingual dictionary fallback for offline chatbot
const MULTILINGUAL_ANSWERS = {
  english: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait). Reasoning: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity. Action: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12. Reasoning: Gate A is the closest entry point to Section A, minimizing walking time. Action: Follow the green floor signs.",
    parking: "We recommend Parking Zone B (East). Reasoning: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues. Action: Drive to Zone B, which is only 50% occupied with an 8-minute walk.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait. Reasoning: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait). Action: Go to the East concourse for quick concessions.",
    washroom: "Nearest restroom: Restroom North (Tier 1). Reasoning: Restroom East (Tier 2) is closed for scheduled cleaning. Action: Proceed to the North concourse washroom (2m wait).",
    exit: "To reach Exit C: Proceed through the south tier corridor. Reasoning: This pathway is clear of congestion and is fully wheelchair-accessible. Action: Follow the green exit arrows.",
    default: "I am ArenaMind AI, your Stadium Assistant. Reasoning: I analyze live sensor data to guide spectators. Action: Ask me about gates, parking, restrooms, food, exits, or seat coordinates."
  },
  hindi: {
    gate: "\u0917\u0947\u091f A \u0916\u093e\u0932\u0940 \u0939\u0948 (3 \u092e\u093f\u0928\u091f \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e)\u0964 \u0917\u0947\u091f B \u092a\u0930 \u092d\u093e\u0930\u0940 \u092d\u0940\u0922\u093c \u0939\u0948 (22 \u092e\u093f\u0928\u091f)\u0964 \u0915\u093e\u0930\u0923: \u0917\u0947\u091f B \u092e\u0941\u0916\u094d\u092f \u0926\u094d\u0935\u093e\u0930 \u0939\u0948 \u091c\u093e\u0939\u093e\u0902 \u092a\u093e\u0930\u094d\u0915\u093f\u0902\u0917 \u091c\u093c\u094b\u0928 B \u0938\u0947 \u0926\u0930\u094d\u0936\u0915 \u0906 \u0930\u0939\u0947 \u0939\u0948\u0902\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u0917\u0947\u091f B \u0938\u0947 \u092c\u091a\u0947\u0902\u0964 \u0924\u0941\u0930\u0902\u0924 \u092a\u094d\u0930\u0935\u0947\u0936 \u0915\u0947 \u0932\u093f\u090f \u0917\u0947\u091f A \u092f\u093e \u0917\u0947\u091f D \u0915\u0940 \u0913\u0930 \u092c\u0922\u093c\u0947\u0902\u0964",
    seat: "\u0938\u0940\u091f A-120 \u092a\u0930 \u091c\u093e\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f: \u0917\u0947\u091f A \u0938\u0947 \u092a\u094d\u0930\u0935\u0947\u0936 \u0915\u0930\u0947\u0902, \u0932\u094b\u0905\u0930 \u091f\u0940\u092f\u0930 1, \u0938\u0947\u0915\u094d\u0936\u0928 A, \u0930\u094b 12 \u092a\u0930 \u091c\u093e\u090f\u0902\u0964 \u0915\u093e\u0930\u0923: \u0917\u0947\u091f A \u0938\u0947\u0915\u094d\u0936\u0928 A \u0915\u093e \u0938\u092c\u0938\u0947 \u0928\u091c\u0926\u0940\u0915\u0940 \u092a\u094d\u0930\u0935\u0947\u0936 \u0926\u094d\u0935\u093e\u0930 \u0939\u0948, \u091c\u094b \u091a\u0932\u0928\u0947 \u0915\u093e \u0938\u092e\u092f \u0918\u091f\u093e\u0924\u093e \u0939\u0948\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u092b\u0930\u094d\u0936 \u092a\u0930 \u092c\u0928\u0947 \u0939\u0930\u0947 \u0928\u093f\u0936\u093e\u0928\u094b\u0902 \u0915\u093e \u092a\u093e\u0932\u0928 \u0915\u0930\u0947\u0902\u0964",
    parking: "\u0939\u092e \u092a\u093e\u0930\u094d\u0915\u093f\u0902\u0917 \u091c\u093c\u094b\u0928 B (\u092a\u0942\u0930\u094d\u0935) \u0915\u0940 \u0938\u0932\u093e\u0939 \u0926\u0947\u0924\u0947 \u0939\u0948\u0902\u0964 \u0915\u093e\u0930\u0923: \u091c\u093c\u094b\u0928 A 86% \u0914\u0930 \u091c\u093c\u094b\u0928 C 98% \u092d\u0930\u093e \u0939\u0941\u0906 \u0939\u0948, \u091c\u093f\u0938\u0938\u0947 \u0935\u0939\u093e\u0902 \u092a\u094d\u0930\u0935\u0947\u0936 \u092e\u0947\u0902 \u0926\u0947\u0930\u0940 \u0939\u094b \u0930\u0939\u0940 \u0939\u0948\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u091c\u093c\u094b\u0928 B \u0915\u0940 \u0913\u0930 \u091c\u093e\u090f\u0902, \u091c\u094b 50% \u0916\u093e\u0932\u0940 \u0939\u0948\u0964",
    food: "\u0938\u092c\u0938\u0947 \u0924\u0947\u091c\u093c \u0935\u093f\u0915\u0932\u094d\u092a \u090f\u0930\u0940\u0928\u093e \u090f\u0915\u094d\u0938\u092a\u094d\u0930\u0947\u0938 \u0915\u0948\u092b\u0947 (\u092a\u0942\u0930\u094d\u0935) \u0939\u0948 (4 \u092e\u093f\u0928\u091f \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e)\u0964 \u0915\u093e\u0930\u0923: \u0917\u094d\u0930\u0948\u0902\u0921 \u092b\u0942\u0921 \u092c\u093e\u091c\u093c\u093e\u0930 (\u092a\u0936\u094d\u091a\u093f\u092e) \u092e\u0947\u0902 \u0913\u0930\u094d\u0921\u0930 \u091a\u0930\u092e \u092a\u0930 \u0939\u0948\u0902 (18 \u092e\u093f\u0928\u091f \u092a\u094d\u0930\u0924\u0940\u0915\u094d\u0937\u093e)\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u0938\u094d\u0928\u0948\u0915\u094d\u0938/\u092a\u092f \u092a\u0926\u093e\u0930\u094d\u0925\u094b\u0902 \u0915\u0947 \u0932\u093f\u090f \u092a\u0942\u0930\u094d\u0935\u0940 \u0915\u0949\u0928\u0915\u094b\u0930\u094d\u0938 \u092a\u0930 \u091c\u093e\u090f\u0902\u0964",
    washroom: "\u0928\u093f\u0915\u091f\u092e \u0936\u094c\u091a\u093e\u0932\u092f: \u0930\u0947\u0938\u094d\u091f\u0930\u0942\u092e \u0928\u0949\u0930\u094d\u0925 (\u091f\u0940\u092f\u0930 1)\u0964 \u0915\u093e\u0930\u0923: \u0930\u0947\u0938\u094d\u091f\u0930\u0942\u092e \u0908\u0938\u094d\u091f (\u091f\u0940\u092f\u0930 2) \u0938\u092b\u093e\u0908 \u0915\u0947 \u0932\u093f\u090f \u092c\u0902\u0926 \u0939\u0948\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u0928\u0949\u0930\u094d\u0925 \u0915\u0949\u0928\u0915\u094b\u0930\u094d\u0938 \u0915\u0947 \u0936\u094c\u091a\u093e\u0932\u092f \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0947\u0902\u0964",
    exit: "\u090f\u0917\u094d\u091c\u093f\u091f \u0938\u0940 \u0924\u0915 \u092a\u0939\u0941\u0902\u091a\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f: \u0926\u0915\u094d\u0937\u093f\u0923 \u091f\u0940\u092f\u0930 \u0915\u0949\u0930\u093f\u0921\u094b\u0930 \u0915\u0947 \u092e\u093e\u0927\u094d\u092f\u092e \u0938\u0947 \u0906\u0917\u0947 \u092c\u0922\u093c\u0947\u0902\u0964 \u0915\u093e\u0930\u0923: \u092f\u0939 \u092e\u093e\u0930\u094d\u0917 \u0938\u093e\u092b \u0939\u0948 \u0914\u0930 \u0935\u094d\u0939\u0940\u0932\u091a\u0947\u092f\u0930 \u0930\u0948\u0902\u092a \u0938\u094d\u0925\u093e\u092a\u093f\u0924 \u0939\u0948\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u0928\u093f\u0915\u093e\u0938 \u0924\u0940\u0930\u094b\u0902 \u0915\u093e \u092a\u093e\u0932\u0928 \u0915\u0930\u0947\u0902\u0964",
    default: "\u092e\u0948\u0902 \u090f\u0930\u0940\u0928\u093e\u092e\u093e\u0907\u0902\u0921 \u090f\u0906\u0908 \u0938\u0939\u093e\u092f\u0915 \u0939\u0942\u0902\u0964 \u0915\u093e\u0930\u0923: \u092e\u0948\u0902 \u0932\u093e\u0907\u0935 \u0938\u0947\u0902\u0938\u0930 \u0921\u0947\u091f\u093e \u0915\u093e \u0909\u092a\u092f\u094b\u0917 \u0915\u0930\u0924\u093e \u0939\u0942\u0902\u0964 \u0915\u093e\u0930\u094d\u0930\u0935\u093e\u0908: \u092e\u0941\u091d\u0938\u0947 \u0938\u0940\u091f, \u0926\u094d\u0935\u093e\u0930, \u092a\u093e\u0930\u094d\u0915\u093f\u0902\u0917, \u0936\u094c\u091a\u093e\u0932\u092f, \u092d\u094b\u091c\u0928 \u0915\u0947 \u092c\u093e\u0930\u0947 \u092e\u0947\u0902 \u092a\u0942\u091b\u0947\u0902\u0964"
  },
  telugu: {
    gate: "\u0c17\u0c47\u0c1f\u0c4d A \u0c16\u0c3e\u0c32\u0c40\u0c17\u0c3e \u0c09\u0c02\u0c26\u0c3f (3 \u0c28\u0c3f\u0c2e\u0c3f\u0c37\u0c3e\u0c32\u0c41). \u0c17\u0c47\u0c1f\u0c4d B \u0c35\u0c26\u0c4d\u0c26 \u0c2d\u0c3e\u0c30\u0c40 \u0c30\u0c26\u0c4d\u0c26\u0c40 \u0c09\u0c02\u0c26\u0c3f (22 \u0c28\u0c3f\u0c2e\u0c3f\u0c37\u0c3e\u0c32\u0c41). \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c17\u0c47\u0c1f\u0c4d B \u0c05\u0c28\u0c45\u0c26\u0c3f \u0c2a\u0c3e\u0c30\u0c4d\u0c15\u0c3f\u0c02\u0c17\u0c4d \u0c1c\u0c4b\u0c28\u0c4d B \u0c28\u0c41\u0c02\u0c21\u0c3f \u0c35\u0c1a\u0c4d\u0c1a\u0c47 \u0c2a\u0c4d\u0c30\u0c47\u0c15\u0c4d\u0c37\u0c15\u0c41\u0c32 \u0c2a\u0c4d\u0c30\u0c27\u0c3e\u0c28 \u0c26\u0c4d\u0c35\u0c3e\u0c30\u0c02. \u0c1a\u0c30\u0c4d\u0c2f: \u0c17\u0c47\u0c1f\u0c4d B \u0c28\u0c3f \u0c28\u0c3f\u0c35\u0c3e\u0c30\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f. \u0c24\u0c15\u0c4d\u0c37\u0c23 \u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36\u0c02 \u0c15\u0c4b\u0c38\u0c02 \u0c17\u0c47\u0c1f\u0c4d A \u0c32\u0c47\u0c26\u0c3e \u0c17\u0c47\u0c1f\u0c4d D \u0c35\u0c48\u0c2a\u0c41 \u0c35\u0c46\u0c3header\u0c4d\u0c33\u0c02\u0c21\u0c3f.",
    seat: "\u0c38\u0c40\u0c1f\u0c4d A-120 \u0c15\u0c3f \u0c1a\u0c47\u0c30\u0c41\u0c15\u0c4b\u0c35\u0c21\u0c3e\u0c28\u0c3f\u0c15\u0c3f: \u0c17\u0c47\u0c1f\u0c4d A \u0c26\u0c4d\u0c35\u0c3e\u0c30\u0c3e \u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f, \u0c32\u0c4b\u0c2f\u0c30\u0c4d \u0c1f\u0c48\u0c30\u0c4d 1, \u0c38\u0c46\u0c15\u0c4d\u0c36\u0c28\u0c4d A, \u0c30\u0c4b 12 \u0c15\u0c3f \u0c35\u0c46\u0c3header\u0c4d\u0c33\u0c02\u0c21\u0c3f. \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c17\u0c47\u0c1f\u0c4d A \u0c05\u0c28\u0c47\u0c26\u0c3f \u0c38\u0c46\u0c15\u0c4d\u0c36\u0c28\u0c4d A \u0c15\u0c3f \u0c05\u0c24\u0c4d\u0c2f\u0c02\u0c24 \u0c38\u0c2e\u0c40\u0c2a \u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36 \u0c26\u0c4d\u0c35\u0c3e\u0c30\u0c02. \u0c1a\u0c30\u0c4d\u0c2f: \u0c28\u0c45\u0c32\u0c2a\u0c48 \u0c09\u0c28\u0c4f \u0c06\u0c15\u0c41\u0c2a\u0c1a\u0c4d\u0c1a \u0c38\u0c42\u0c1a\u0c3f\u0c15\u0c32\u0c28\u0c41 \u0c05\u0c28\u0c41\u0c38\u0c30\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f.",
    parking: "\u0c2e\u0c47\u0c2e\u0c4d \u0c2a\u0c3e\u0c30\u0c4d\u0c15\u0c3f\u0c02\u0c17\u0c4d \u0c1c\u0c4b\u0c28\u0c4d B (\u0c24\u0c4d\u0c30\u0c4d\u0c2a\u0c41) \u0c28\u0c3f \u0c38\u0c3f\u0c2b\u0c3e\u0c30\u0c4d\u0c38\u0c41 \u0c1a\u0c47\u0c3స్తుంది. \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c1c\u0c4b\u0c28\u0c4d A 86% \u0c28\u0c3f\u0c02\u0c21\u0c3f\u0c2a\u0c4b\u0c2f\u0c3f\u0c02\u0c26\u0c3f, \u0c1c\u0c4b\u0c28\u0c4d C 98% \u0c28\u0c3f\u0c02\u0c21\u0c3f\u0c2a\u0c4b\u0c2f\u0c3f\u0c02\u0c26\u0c3f. \u0c1a\u0c30\u0c4d\u0c2f: \u0c1c\u0c4b\u0c28\u0c4d B \u0c35\u0c48\u0c2a\u0c41 \u0c2a\u0c4d\u0c30\u0c2f\u0c3e\u0c23\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f, \u0c07\u0c26\u0c3f 50% \u0c16\u0c3e\u0c22\u0c40\u0c17\u0c3e \u0c09\u0c02\u0c26\u0c3f.",
    food: "\u0c35\u0c47\u0c17\u0c35\u0c02\u0c24\u0c2e\u0c48\u0c28 \u0c06\u0c2a\u0c4d\u0c36\u0c28\u0c4d \u0c05\u0c30\u0c40\u0c28\u0c3e \u0c0e\u0c15\u0c4d\u0c38\u0c4d\u0c2a\u0c4d\u0c30\u0c46\u0c38\u0c4s (\u0c24\u0c4d\u0c30\u0c4d\u0c2a\u0c41) (4 \u0c28\u0c3f\u0c2e\u0c3f\u0c37\u0c3e\u0c32\u0c41). \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c17\u0c4d\u0c30\u0c3e\u0c02\u0c21\u0c4d \u0c2b\u0c4d\u0c21\u0c4d \u0c2c\u0c1c\u0c3e\u0c30\u0c4d (\u0c2a\u0c21\u0c2e\u0c30) \u0c35\u0c26\u0c4d\u0c26 \u0c06\u0c30\u0c4d\u0c21\u0c30\u0c4d\u0c32\u0c41 \u0c0e\u0c15\u0c4d\u0c15\u0c41\u0c35\u0c17\u0c3e \u0c09\u0c28\u0c4e\u0c2f\u0c3f (18 \u0c28\u0c3f\u0c2e\u0c3f\u0c37\u0c3e\u0c32\u0c41). \u0c1a\u0c30\u0c4d\u0c2f: \u0c08\u0c38\u0c4d\u0c1f\u0c4d \u0c15\u0c3e\u0c28\u0c4d\u0c15\u0c4b\u0c30\u0c4d\u0c38\u0c4d \u0c15\u0c3f \u0c35\u0c46\u0c3header\u0c4d\u0c33\u0c02\u0c21\u0c3f.",
    washroom: "\u0c38\u0c2e\u0c40\u0c2a \u0c35\u0c3e\u0c37\u0c4d\u0c30\u0c4d\u0c2e\u0c4d: \u0c28\u0c3e\u0c30\u0c4d\u0c25\u0c4d \u0c35\u0c3e\u0c3\u0c4d\u0c30\u0c4d\u0c2e\u0c4d (\u0c1f\u0c48\u0c30\u0c4d 1). \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c08\u0c38\u0c4d\u0c1f\u0c4d \u0c35\u0c3e\u0c3\u0c4d\u0c30\u0c4d\u0c2e\u0c4d (\u0c1f\u0c48\u0c30\u0c4d 2) \u0c2a\u0c4d\u0c30\u0c3group \u0c24\u0c41\u0c24\u0c02 \u0c15\u0c4d\u0c32\u0c40\u0c28\u0c3f\u0c02\u0c17\u0c4d \u0c32\u0c4b \u0c09\u0c02\u0c26\u0c3f. \u0c1a\u0c30\u0c4d\u0c2f: \u0c28\u0c3e\u0c30\u0c4d\u0c25\u0c4d \u0c15\u0c3e\u0c28\u0c4d\u0c15\u0c4b\u0c30\u0c4d\u0c38\u0c4d \u0c35\u0c3e\u0c3\u0c4d\u0c30\u0c4d\u0c2e\u0c4d \u0c15\u0c3f \u0c35\u0c46\u0c3header\u0c4d\u0c33\u0c02\u0c21\u0c3f.",
    exit: "\u0c0e\u0c15\u0c4d\u0c1c\u0c3f\u0c1f\u0c4d C \u0c15\u0c3f \u0c1a\u0c47\u0c30\u0c41\u0c15\u0c4b\u0c35\u0c21\u0c3e\u0c28\u0c3f\u0c15\u0c3f: \u0c38\u0c4c\u0c25\u0c4d \u0c1f\u0c48\u0c30\u0c4d \u0c15\u0c3e\u0c30\u0c23\u0c02 \u0c26\u0c4d\u0c35\u0c3e\u0c30\u0c3e \u0c35\u0c46\u0c3header\u0c4d\u0c33\u0c02\u0c21\u0c3f. \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c08 \u0c2e\u0c3e\u0c30\u0c4d\u0c17\u0c02 \u0c3span\u0c4d\u0c1f\u0c02\u0c17\u0c3e \u0c09\u0c02\u0c26\u0c3f \u0c2e\u0c3count\u0c3f\u0c2f\u0c4d \u0c35\u0c40\u0c32\u0c4d\u0c1a\u0c46\u0c2f\u0c3f\u0c30\u0c4d \u0c30\u0c4d\u0c2f\u0c3e\u0c02\u0c2a\u0c41\u0c32\u0c28\u0c41 \u0c15\u0c3లి\u0c17\u0c3f \u0c09\u0c02\u0c26\u0c3f. \u0c1a\u0c30\u0c4d\u0c2f: \u0c0e\u0c15\u0c4d\u0c1c\u0c3f\u0c1f\u0c4d \u0c2c\u0c3e\u0c23\u0c3e\u0c32\u0c28\u0c41 \u0c05\u0c28\u0c41\u0c38\u0c3ref\u0c3f\u0c02\u0c1a\u0c02\u0c21\u0c3f.",
    default: "\u0c28\u0c47\u0c28\u0c41 \u0c05\u0c30\u0c40\u0c28\u0c3e\u0c2e\u0c48\u0c28\u0c4d\u0c26\u0c4d AI \u0c38\u0c39\u0c3e\u0c2f\u0c15\u0c41\u0c21\u0c3f\u0c28\u0c3f. \u0c15\u0c3e\u0c30\u0c23\u0c02: \u0c2e\u0c40\u0c15\u0c41 \u0c2e\u0c3e\u0c30\u0c4d\u0c17\u0c26\u0c30\u0c4d\u0c36\u0c15\u0c24\u0c4d\u0c35\u0c02 \u0c1a\u0c47\u0c2f\u0c21\u0c3e\u0c28\u0c3f\u0c15\u0c3f \u0c28\u0c47\u0c28\u0c41 \u0c32\u0c48\u0c35\u0c4d \u0c38\u0c46\u0c28\u0c4d\u0c38\u0c28\u0c4d\u0c28\u0c41 \u0c05\u0c28\u0c41\u0c38\u0c3ref\u0c3f\u0c38\u0c4d\u0c24\u0c3e\u0c28\u0c41. \u0c1a\u0c30\u0c4d\u0c2f: \u0c17\u0c47\u0c1f\u0c4d\u0c32\u0c41, \u0c2a\u0c3e\u0c30\u0c4d\u0c15\u0c3f\u0c02\u0c17\u0c4d, \u0c35\u0c3e\u0c37\u0c4d\u0c30\u0c4d\u0c2e\u0c4d\u0c32\u0c41 \u0c32\u0c47\u0c26\u0c3e \u0c06\u0c39\u0c3e\u0c30\u0c02 \u0c17\u0c41\u0c30\u0c3f\u0c02\u0c1a\u0c3f \u0c05\u0c21\u0c17\u0c02\u0c21\u0c3f."
  },
  tamil: {
    gate: "\u0b95\u0bc7\u0b9f\u0bcd A \u0b95\u0bbe\u0bb2\u0bbf\u0baf\u0bbeக \u0b89ள\u0bcdள\u0ba4\u0bc1 (3 \u0ba8ிமிட \u0b95\u0bbe\u0ba5\u0bcd\u0ba4\u0bbf\u0bb0\u0bc1ப\u0bcd\u0baa\u0bc1). \u0b95\u0bc7\u0b9f\u0bcd B \u0b87ல\u0bcd \u0b85திக \u0b95\u0bc2ட்\u0b9f \u0ba8ெரிசல\u0bcd (22 \u0ba8ிமிட\u0b99\u0bcd\u0b95\u0bb3\u0bcd). \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0b95\u0bc7\u0b9f\u0bcd B \u0b8eன்ப\u0ba4ு \u0baaா\u0bb0்\u0b95\u0bcd\u0b95\u0bbfங\u0bcd \u0baeன்ட\u0bb2\u0bae் B \u0b87ல\u0bbfருந\u0bcd\u0ba4ு \u0bb5ரும் \u0baaா\u0bb0\u0bcd\u0bb5\u0bc8\u0bafா\u0bb3\u0bb0\u0bcd\u0b95\u0bb3\u0bbfன் \u0baeுக்\u0b95ி\u0baf \u0ba8\u0bc1\u0bbcheck\u0bc5\u0bb5\u0bbe\u0baf\u0bbf\u0bb2\u0bcd. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0b95\u0bc7\u0b9f\u0bcd B \u0b95\u0bc7 \u0b9a\u0bc6\u0bb2\u0bcd\u0bb5\u0ba4\u0bc8\u0ba4\u0bcd \u0ba4\u0bb5\u0bbf\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bc1\u0bae\u0bcd. \u0b95\u0bc7\u0b9f\u0bcd A \u0b85ல\u0bcdல\u0ba4\u0bc1 \u0b95\u0bc7\u0b9f\u0bcd D \u0bb5\u0bb4\u0bbfய\u0bbe\u0b95 \u0ba8\u0bc1\u0bbcheck\u0bc5\u0baf\u0bb5\u0bc1\u0bae\u0bcd.",
    seat: "\u0b9a\u0bc0\u0b9f\u0bcd A-120 \u0b90 \u0b85\u0b9f\u0bc8ய: \u0b95\u0bc7\u0b9f\u0bcd A \u0bb5\u0bb4\u0bbfயா\u0b95 \u0ba8\u0bc1\u0bbcheck\u0bc5\u0ba8\u0bcd\u0ba4\u0bc1, \u0b95\u0bc0\u0bb4் \u0b85ட\u0bc8\u0bb5\u0bc1 1, \u0baaி\u0bb0\u0bbf\u0bb5\u0bc1 A, \u0bb5\u0bb0\u0bbf\u0b9a\u0bc8 12 \u0b95\u0bcd\u0b95\u0bc1 \u0ba8\u0b9f\u0ba8\u0bcd\u0ba4\u0bc1 \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bb5\u0bc1\u0bae\u0bcd. \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0b95\u0bc7\u0b9f\u0bcd A \u0baaி\u0bb0\u0bbf\u0bb5\u0bc1 A \u0b95\u0bcd\u0b95\u0bc1 \u0baeி\u0b95\u0bb5\u0bc1\u0bae\u0bcd \u0b85\u0bb0\u0bc1\u0b95\u0bbf\u0bb2\u0bcd \u0b89\u0bb3\u0bcd\u0bb3 \u0ba8\u0bc1\u0bbcheck\u0bc5\u0bb5\u0bbe\u0baf\u0bbf\u0bb2\u0bcd. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0ba4\u0bb0\u0bc8\u0baf\u0bbf\u0bb2\u0bcd \u0b89\u0bb3\u0bcd\u0bb3 \u0baaச\u0bcd\u0b9a\u0bc8 \u0ba8\u0bbf\u0bb0 \u0b95\u0bc1\u0bbcheck\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf\u0b95\u0bb3\u0bc8\u0baa\u0bcd \u0baa\u0bbf\u0ba9\u0bcd\u0baa\u0bb0\u0bcd\u0bb1\u0bc1\u0b95.",
    parking: "\u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bbf\u0b99\u0bcd \u0baeன்ட\u0bb2\u0bae் B (\u0b95\u0bbf\u0bb4\u0b95\u0bcd\u0b95\u0bc1) \u0baa\u0bb0\u0bbf\u0ba8\u0bcd\u0ba4\u0bc1\u0bb0\u0bc8\u0b95\u0bcd\u0b95\u0bbf\u0bb1\u0bc7\u0bbe\u0bae\u0bcd. \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0baeன்ட\u0bb2\u0bae் A 86% \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0baeன்ட\u0bb2\u0bae் C 98% \u0ba8\u0bbf\u0bb1\u0bc8\u0ba8\u0bcd\u0ba4\u0bc1\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0baeன்ட\u0bb2\u0bae் B \u0b95\u0bcd\u0b95\u0bc1\u0b9a\u0bcd \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bc1\u0b95, \u0b87\u0ba4\u0bc1 50% \u0b95\u0bbe\u0bb2\u0bbfய\u0bbeக \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1.",
    food: "\u0bb5\u0bbf\u0bb0\u0bc8\u0bb5\u0bbe\u0ba9 \u0bb5\u0bbf\u0bb0\u0bc1\u0baa\u0bcd\u0baa\u0bae\u0bcd: \u0b85\u0bb0\u0bc0\u0ba9\u0bbe \u0b8e\u0b95\u0bcd\u0bb8\u0bcd\u0baaி\u0bb0\u0bb8\u0bcd \u0b95\u0b83\u0baa\u0bc7 (\u0b95\u0bbf\u0bb4\u0b95\u0bcd\u0b95\u0bc1) (4 \u0ba8ிcheck\u0bbf\u0b9f காத்திருப்பு). \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0b95\u0bbf\u0bb0\u0bbe\u0ba9்\u0b9f\u0bcd \u0baa\u0bc1\u0b9f\u0bcd \u0baa\u0b9c\u0bbe\u0bb0\u0bcd (\u0bae\u0bc7\u0bb1\u0bcd\u0b95\u0bc1) \u0b85\u0ba4\u0bbf\u0b95 \u0b86\u0bb0\u0bcd\u0b9f\u0bb0\u0bcd \u0bb5\u0bb0\u0bc1\u0b95\u0bbf\u0bb1\u0ba4\u0bc1. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0b95\u0bbf\u0bb4\u0b95\u0bcd\u0b95\u0bc1 \u0b95\u0bbe\u0ba9\u0bcd\u0b95\u0bc7\u0bbe\u0bb0\u0bcd\u0bb8\u0bcd \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bc1\u0b95.",
    washroom: "\u0b85\u0bb0\u0bc1\u0b95\u0bbf\u0bb2\u0bcd \u0b89\u0bb3\u0bcd\u0bb3 \u0b95\u0bb4\u0bbfப்\u0baa\u0bb1\u0bc8: \u0bb5\u0b9f\u0b95\u0bcd\u0b95\u0bc1 \u0b95\u0bb4\u0bbfப்\u0baa\u0bb1\u0bc8 (\u0b85\u0b9f\u0bc8\u0bb5\u0bc1 1). \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0b95\u0bbf\u0bb4\u0b95\u0bcd\u0b95\u0bc1 \u0b95\u0bb4\u0bbfப்\u0baa\u0bb1\u0bc8 (\u0b85\u0b9f\u0bc8\u0bb5\u0bc1 2) \u0ba4\u0bb1\u0bcd\u0baa\u0bc7\u0bbe\u0ba4\u0bc1 \u0b9a\u0bc1\u0ba4\u0bcd\u0ba4\u0bae\u0bcd \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95ி\u0bb1\u0ba4\u0bc1. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0bb5\u0b9f\u0b95\u0bcd\u0b95\u0bc1 \u0b95\u0bbe\u0ba9\u0bcd\u0b95\u0bc7\u0bbe\u0bb0\u0bcd\u0bb8\u0bcd \u0b95\u0bb4\u0bbfப்\u0baa\u0bb1\u0bc8\u0b95\u0bcd\u0b95\u0bc1\u0b9a\u0bcd \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bc1\u0b95.",
    exit: "\u0bb5\u0bc6\u0bb3\u0bbfய\u0bc7\u0bb1\u0bc1\u0bae\u0bcd \u0bb5\u0bb4\u0bbf C-\u0b95\u0bcd\u0b95\u0bc1: \u0ba4ெற\u0bcd\u0b95\u0bc1 \u0b85\u0b9f\u0bc8\u0bb5\u0bc1 \u0ba8\u0b9f\u0baa\u0bbe\u0ba4\u0bc8 \u0bb5\u0bb4\u0bbfய\u0bbe\u0b95\u0b9a\u0bcd \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bc1\u0b95. \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0b87\u0ba8\u0bcd\u0ba4 \u0baaா\u0ba4\u0bc8 \u0ba4\u0bc6ள\u0bbfவ\u0bbe\u0b95 \u0b89\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1 \u0bae\u0bb1\u0bcd\u0bb1\u0bc1\u0bae\u0bcd \u0b9a\u0b95\u0bcd\u0b95\u0bb0 \u0ba8\u0bbeற\u0bcd\u0b95\u0bbe\u0bb2\u0bbf \u0b9a\u0bb0\u0bbf\u0bb5\u0bc1\u0b95\u0bb3\u0bc8\u0b95\u0bcd \u0b95ொண\u0bcd\u0b9f\u0bc1\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0bb5\u0bc6\u0bb3\u0bbfய\u0bc7\u0bb1\u0bc1\u0bae\u0bcd \u0b95\u0bc1\u0bbcheck\u0bbf\u0b95\u0bbe\u0b9f\u0bcd\u0b9f\u0bbf \u0b85ம்\u0baa\u0bc1\u0b95\u0bb3\u0bc8\u0baa\u0bcd \u0baa\u0bbf\u0ba9\u0bcd\u0baa\u0bb0\u0bcd\u0bb1\u0bc1\u0b95.",
    default: "\u0ba8\u0bbe\u0ba9\u0bcd \u0b85\u0bb0\u0bc0\u0ba9\u0bbe\u0baeை\u0ba9்\u0b9f\u0bcd AI \u0baeைத\u0bbeன \u0b89\u0ba4\u0bb5\u0bbfய\u0bbe\u0bb3\u0bb0\u0bcd. \u0b95\u0bbe\u0bb0\u0ba3\u0bae்: \u0bb5\u0bb4\u0bbf\u0b95\u0bbeட\u0bcd\u0b9f \u0ba8\u0bc7\u0bb0\u0b9f\u0bbf \u0b9a\u0bc6\u0ba9\u0bcd\u0b9a\u0bbe\u0bb0\u0bcd \u0ba4\u0bb5\u0bb2\u0bcd\u0b95\u0bb3\u0bc8\u0baa\u0bcd \u0baaய\u0ba9\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1\u0b95\u0bbf\u0bb1\u0bc7\u0ba9\u0bcd. \u0ba8\u0b9f\u0bb5\u0b9f\u0bbf\u0b95\u0bcd\u0b95\u0bc8: \u0b87\u0bb0\u0bc1\u0b95\u0bcd\u0b95\u0bc8, \u0bb5\u0bbeய\u0bbf\u0bb2\u0bcd, \u0baa\u0bbe\u0bb0\u0bcd\u0b95\u0bcd\u0b95\u0bbf\u0b99\u0bcd \u0b85\u0bb2\u0bcd\u0bb2\u0ba4\u0bc1 \u0b85\u0ba3\u0bc1\u0b95\u0bc1\u0bb5\u0bb4\u0bbf \u0baa\u0bb1\u0bcd\u0bb1\u0bbf \u0b95\u0bc7\u0bbள\u0bc1\u0b95."
  },
  kannada: {
    gate: "\u0c97\u0cc7\u0c9f\u0ccd A \u0c96\u0cbe\u0cb2\u0cbf\u0caf\u0cbe\u0c97\u0cbf\u0ca6\u0cc6 (3 \u0ca2\u0cbf\u0ca8\u0cbf\u0c9f\u0ccd \u0c95\u0cbe\u0caf\u0cc1\u0cb5\u0cbf\u0c95\u0cc6). \u0c97\u0cc7\u0c9f\u0ccd B \u0ca2\u0cb2\u0ccd\u0cb2\u0cbf \u0cad\u0cbe\u0cb0\u0cbf \u0c9c\u0ca2\u0ca6\u0cwait\u0ccd\u0ca4\u0ca3\u0cc6 (22 \u0ca2\u0cbf\u0ca8\u0cbf\u0c9f\u0ccd). \u0c95\u0cbe\u0cb0\u0ca3: \u0c97\u0cc7\u0c9f\u0ccd B \u0caa\u0cbe\u0cb0\u0ccd\u0c95\u0cbf\u0c92\u0c97\u0ccd \u0cb5\u0cb2\u0caf B \u0caf\u0cbf\u0c82\u0ca6 \u0cac\u0cb0\u0cc1\u0cb5 \u0caa\u0ccd\u0cb0\u0cc7\u0c95\u0ccd\u0cb7\u0c95\u0cb0 \u0ca2\u0cc1\u0c96\u0ccd\u0caf \u0ca6\u0ccd\u0cb5\u0cbe\u0cb0\u0cb5\u0cbe\u0c97\u0cbf\u0ca6\u0cc6. \u0c95\u0ccd\u0cb0\u0ca2: \u0c97\u0cc7\u0c9f\u0ccd B \u0c8tab \u0ca4\u0caa\u0ccd\u0caa\u0cbf\u0cb8\u0cbf. \u0ca4\u0c95\u0ccd\u0cb7\u0ca3 \u0caa\u0ccd\u0cb0\u0cb5\u0cc7\u0cb6\u0c95\u0ccd\u0c95\u0cbe\u0c97\u0cbf \u0c97\u0cc7\u0c9f\u0ccd A \u0c8tab\u0ccd\u0cb2\u0cc1 \u0c97\u0cc7\u0c9f\u0ccd D \u0c97\u0cc6 \u0ca4\u0cc6\u0cb0\u0cb3\u0cbf.",
    seat: "\u0c98\u0cc0\u0c9f\u0ccd A-120 \u0ca4\u0cb2\u0cc1\u0caa\u0cb2\u0cc1: \u0c97\u0cc7\u0c9f\u0ccd A \u0ca2\u0cc2\u0cb2\u0c95 \u0caa\u0ccd\u0cb0\u0cb5\u0cc7\u0cb6\u0cbf\u0cb8\u0cbf, \u0c95\u0cc6\u0cbStep \u0cb6\u0ccd\u0cb0\u0cc7\u0ca3\u0cbf 1, \u0cb5\u0cbf\u0cad\u0cbe\u0c97 A, \u0cb8\u0cbe\u0cb2\u0cc1 12 \u0c95\u0ccd\u0c95\u0cc6 \u0cb9\u0ccb\u0c97\u0cbf. \u0c95\u0cbe\u0cb0\u0ca3: \u0c97\u0cc7\u0c9f\u0ccd A \u0cb5\u0cbf\u0cad\u0cbe\u0c97 A \u0c97\u0cc6 \u0c85\u0ca4\u0ccd\u0caf\u0c82\u0ca4 \u0cb9\u0ca4\u0ccd\u0ca4\u0cbf\u0cb0\u0ca6 \u0caa\u0ccd\u0cb0\u0cb5\u0cc7\u0cb6 \u0ca6\u0ccd\u0cb5\u0cbe\u0cb0\u0cb5\u0cbe\u0c97\u0cbf\u0ca6\u0cc6. \u0c95\u0ccd\u0cb0\u0ca2: \u0ca8\u0cc6\u0cb2\u0ca6 \u0ca2\u0cc7\u0cb2\u0cbf\u0ca8 \u0cb9\u0cbf\u0cb0\u0cbf\u0caf \u0c97\u0cc1\u0cb0\u0cc1\u0ca4\u0cc1\u0c97\u0cb3\u0ca8\u0ccd\u0ca4\u0cc1 \u0c85\u0ca8\u0cc1\u0cb8\u0cb0\u0cbf\u0cb8\u0cbf.",
    parking: "\u0ca8\u0cbe\u0cb5\u0cc1 \u0caa\u0ccd\u0cb0\u0ccb \u0caa\u0cbe\u0cb0\u0ccd\u0c95\u0cbf\u0c92\u0c97\u0ccd \u0cb5\u0cb2\u0caf B (\u0caa\u0cc2\u0cb0\u0ccd\u0cb5) \u0c8tab\u0ccd\u0cb2\u0cc1 \u0cb9\u0cbf\u0caa\u0cbe\u0cb0\u0cb8\u0cc1 \u0ca2\u0cbe\u0ca1\u0cc1\u0ca4\u0ccd\u0ca4\u0cc7\u0cb5\u0cc6. \u0c95\u0cbe\u0cb0\u0ca3: \u0cb5\u0cb2\u0caf A \u0cb6\u0cc7 86% \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0cb5\u0cb2\u0caf C \u0cb6\u0cc7 98% \u0ca5\u0cc1\u0c82\u0cac\u0cbf\u0ca6\u0cc6. \u0c95\u0ccd\u0cb0\u0ca2: \u0cb5\u0cb2\u0caf B \u0c97\u0cc6 \u0ca4\u0cc6\u0cb0\u0cb3\u0cbf, \u0c87\u0ca6\u0cc1 50% \u0c96\u0cbe\u0cb2\u0cbf\u0caf\u0cbe\u0c97\u0cbf\u0ca6\u0cc6.",
    food: "\u0cb5\u0cc7\u0c97\u0cb5\u0cbe\u0ca6 \u0c86\u0caf\u0ccd\u0c95\u0cc6 \u0c85\u0cb0\u0cc6\u0ca8\u0cbe \u0c8e\u0c95\u0ccd\u0cb8\u0ccd\u0caa\u0ccd\u0cb0\u0cc6\u0cb8\u0ccd \u0c95\u0cc6\u0cab\u0cc6 (\u0caa\u0cc2\u0cb0\u0ccd\u0cb5) (4 \u0ca2\u0cbf\u0ca8\u0cbf\u0c9f\u0ccd \u0c95\u0cbe\u0caf\u0cc1\u0cb5\u0cbf\u0c95\u0cc6). \u0c95\u0cbe\u0cb0\u0ca3: \u0c97\u0ccd\u0cb0\u0ccd\u0c82\u0ca1\u0ccd \u0caa\u0cc1\u0ca1\u0ccd \u0cac\u0c9c\u0cbe\u0cb0\u0ccd (\u0caa\u0cbStep\u0cbf\u0cae) \u0ca2\u0cb2\u0ccd\u0cb2\u0cbf \u0cad\u0cbe\u0cb0\u0cbf \u0c86\u0cb0\u0ccd\u0ca1\u0cb0\u0ccd\u0c97\u0cb3\u0cbf\u0cb5\u0cc6 (18 \u0ca2\u0cbf\u0ca8\u0cbf\u0c9f\u0ccd). \u0c95\u0ccd\u0cb0\u0ca2: \u0caa\u0cc2\u0cb0\u0ccd\u0cb5 \u0c95\u0cbe\u0ca8\u0ccd\u0c95\u0ccb\u0cb0\u0ccd\u0cb8\u0ccd \u0c97\u0cc6 \u0cb9\u0ccb\u0c97\u0cbf.",
    washroom: "\u0cb9\u0ca4\u0ccd\u0ca4\u0cbf\u0cb0\u0ca6 \u0cb6\u0ccc\u0c9a\u0cbe\u0cb2\u0caf: \u0c8tab\u0ccd\u0ca4\u0cb0 \u0cb6\u0ccc\u0c9a\u0cbe\u0cb2\u0caf (\u0cb6\u0ccd\u0cb0\u0cc7\u0ca3\u0cbf 1). \u0c95\u0cbe\u0cb0\u0ca3: \u0caa\u0cc2\u0cb0\u0ccd\u0cb5 \u0cb6\u0ccc\u0c9a\u0cbe\u0cb2\u0caf (\u0cb6\u0ccd\u0cb0\u0cc7\u0ca3\u0cbf 2) \u0caa\u0ccd\u0cb0\u0cbwait\u0cc1\u0ca4 \u0cb8\u0ccd\u0cb5\u0c9a\u0ccd\u0c9b\u0c97\u0cca\u0cb2\u0cbf\u0cb8\u0cb2\u0cc1 \u0ca2\u0cc1\u0c9a\u0ccd\u0cb2\u0cbe\u0c97\u0cbf\u0ca6\u0cc6. \u0c95\u0ccd\u0cb0\u0ca2: \u0c8tab\u0ccd\u0ca4\u0cb0 \u0c95\u0cbe\u0ca8\u0ccd\u0c95\u0ccb\u0cb0\u0ccd\u0cb8\u0ccd \u0cb6\u0ccc\u0c9a\u0cbe\u0cb2\u0caf\u0cb5\u0ca8\u0ccd\u0ca4\u0cc1 \u0cac\u0cb2\u0cbf\u0cb8\u0cbf.",
    exit: "\u0c8e\u0c95\u0ccd\u0cb8\u0cbf\u0c9f\u0ccd \u0cb8\u0cbf \u0ca4\u0cb2\u0cc1\u0caa\u0cb2\u0cc1: \u0ca6\u0c95\u0ccd\u0cb7\u0cbf\u0ca3 \u0cb6\u0ccd\u0cb0\u0cc7\u0ca3\u0cbf\u0caf \u0c95\u0cbe\u0cb0\u0cbf\u0ca1\u0cbe\u0cb0\u0ccd \u0ca2\u0cc2\u0cb2\u0c95 \u0cb9\u0ccb\u0c97\u0cbf. \u0c95\u0cbe\u0cb0\u0ca3: \u0ca8\u0cae\u0ccd\u0cae \u0ca2\u0cbe\u0cb0\u0ccd\u0c97\u0cb5\u0cc1 \u0cb8\u0ccd\u0caa\u0cb7\u0ccd\u0c9f\u0cb5\u0cbe\u0c97\u0cbf\u0ca6\u0cc6 \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0c97\u0cbe\u0cb2\u0cbf\u0c95\u0cc1\u0cb0\u0ccd\u0c9a\u0cbf \u0c8b\u0cb3\u0cbf\u0c9c\u0cbe\u0cb0\u0cc1\u0c97\u0cb3\u0ca8\u0ccd\u0ca4\u0cc1 \u0cb9\u0ccb\u0c82\u0ca6\u0cbf\u0ca6\u0cc6. \u0c95\u0ccd\u0cb0\u0ca2: \u0c8e\u0c95\u0ccd\u0cb8\u0cbf\u0c9f\u0ccd \u0cac\u0cbe\u0ca3\u0c97\u0cb3\u0ca8\u0ccd\u0ca4\u0cc1 \u0c85\u0ca8\u0cc1\u0cb8\u0cb0\u0cbf\u0cb8\u0cbf.",
    default: "\u0ca2\u0cbe\u0ca8\u0cc1 \u0c85\u0cb0\u0cc6\u0ca8\u0cbe\u0cae\u0cc8\u0ca8\u0ccd\u0ca6\u0ccd AI \u0cb8\u0ccd\u0c9f\u0cc7\u0ca1\u0cbf\u0caf\u0ca2\u0ccd \u0cb8\u0cb9\u0cbe\u0caf\u0c95. \u0c95\u0cbe\u0cb0\u0ca3: \u0ca2\u0cbe\u0cb0\u0ccd\u0c97\u0ca6\u0cb0\u0ccd\u0cb6\u0ca8 \u0ca8\u0cc2\u0ca1\u0cb2\u0cc1 \u0ca8\u0cbe\u0ca8\u0cc1 \u0cb2\u0cc8\u0cb5\u0ccd \u0cb8\u0cc6\u0ca8\u0ccd\u0cb8\u0cbe\u0cb0\u0ccd \u0cae\u0cbe\u0cbtag\u0cbf\u0ca4\u0cbf \u0cac\u0cb2\u0cbf\u0cb8\u0cc1\u0ca4\u0ccd\u0ca4\u0cc7\u0cb8\u0cc6. \u0c95\u0ccd\u0cb0\u0ca2: \u0c86\u0cb8\u0ca8\u0c97\u0cb3\u0cc1, \u0c97\u0cc7\u0c9f\u0ccd\u0c97\u0cb3\u0cc1, \u0caa\u0cbe\u0cb0\u0ccd\u0c95\u0cbf\u0c92\u0c97\u0ccd, \u0cb6\u0ccc\u0c9a\u0cbe\u0cb2\u0caf \u0cae\u0ca4\u0ccd\u0ca4\u0cc1 \u0c86\u0cb9\u0cbe\u0cb0\u0ca6 \u0cac\u0c97\u0cc6\u0c97\u0cc6 \u0c95\u0cc7\u0cb3\u0cbf."
  }
};

// Announcement translations dictionary
const PRESET_TRANSLATIONS = {
  "gate a closed": {
    english: "Gate A is closed due to high crowd density. Please proceed to Gate B or Gate D.",
    telugu: "ఎక్కువ రద్దీ కారణంగా గేట్ A మూసివేయబడింది. దయచేసి గేట్ B లేదా గేట్ D కి వెళ్ళండి.",
    hindi: "अत्यधिक भीड़ के कारण गेट A बंद है। कृपया गेट B या गेट D की ओर बढ़ें।",
    tamil: "அதிக கூட்ட நெரிசல் காரணமாக கேட் A மூடப்பட்டுள்ளது. தயவுசெய்து கேட் B அல்லது கேட் D க்கு செல்லவும்.",
    kannada: "ಹೆಚ್ಚಿನ ಜನದಟ್ಟಣೆಯ ಕಾರಣ ಗೇಟ್ A ಅನ್ನು ಮುಚ್ಚಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಗೇಟ್ B ಅಥವಾ ಗೇಟ್ D ಗೆ ತೆರಳಿ."
  },
  "emergency evacuation": {
    english: "Attention! Emergency evacuation ordered. Please proceed immediately to the nearest glowing exit gate.",
    telugu: "శ్రద్ధ! అత్యవసర నిష్క్రమణ ఆదేశించబడింది. దయచేసి వెంటనే సమీప నిష్క్రమణ గేటు వైపు వెళ్ళండి.",
    hindi: "ध्यान दें! आपातकालीन निकासी का आदेश दिया गया है। कृपया तुरंत निकटतम निकास द्वार की ओर बढ़ें।",
    tamil: "கவனம்! அவசர வெளியேற்றம் உத்தரவிடப்பட்டுள்ளது. தயவுசெய்து உடனடியாக அருகிலுள்ள வெளியேறும் வாயிலுக்குச் செல்லவும்.",
    kannada: "ಗಮನಿಸಿ! ತುರ್ತು ಸ್ಥಳಾಂತರಕ್ಕೆ ಆದೇಶಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ತಕ್ಷಣ ಹತ್ತಿರದ ನಿರ್ಗಮನ ಗೇಟ್‌ಗೆ ತೆರಳಿ."
  },
  "rain shelter warning": {
    english: "Heavy rain expected shortly. Canopy shutters are opening. Shaded seating areas are open to all.",
    telugu: "త్వరలో భారీ వర్షం కురిసే అవకాశం ఉంది. కానోపీ షట్టర్లు తెరుచుకుంటున్నాయి. నీడ ఉన్న సీట్లు అందరికీ అందుబాటులో ఉన్నాయి.",
    hindi: "जल्द ही भारी बारिश की उम्मीद है। कैनोपी शटर खुल रहे हैं। छायादार बैठने के क्षेत्र सभी के लिए खुले हैं।",
    tamil: "சிறಿscore நேரத்தில் பலத்த மழை பெய்யக்கூடும். விதான கதவுகள் திறக்கப்படுகின்றன. நிழலான இருக்கைகள் அனைவருக்கும் திறக்கப்பட்டுள்ளன.",
    kannada: "ಶೀಘ್ರದಲ್ಲೇ ಭಾರಿ ಮಳೆಯಾಗುವ ನಿರೀಕ್ಷೆಯಿದೆ. ಮೇಲಾವರಣ ಶಟರ್‌ಗಳು ತೆರೆಯುತ್ತಿವೆ. ನೆರಳಿನ ಆಸನ ಪ್ರದೇಶಗಳು ಎಲ್ಲರಿಗೂ ಮುಕ್ತವಾಗಿವೆ."
  }
};

// ----------------------------------------------------
// 1. Conversational Chatbot Route
router.post('/chat', async (req, res) => {
  const { message, language = 'english', userRole = 'spectator' } = req.body;
  const prompt = message ? message.toLowerCase() : '';
  const langKey = MULTILINGUAL_ANSWERS[language] ? language : 'english';

  // If Gemini API Key is configured, attempt to use it
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const systemContext = `
        You are ArenaMind AI, an enterprise-grade smart stadium operation assistant. 
        The current user has the role: '${userRole}'.
        Answer the spectator/operator naturally in the requested language: '${language}'.
        Keep responses concise, helpful, and specific to stadium operations (seats, gates, crowd control, restrooms, exits).
        Stadium details:
        - Seat A-120: Tier 1, Section A, Row 12. Wheelchair accessible.
        - Restrooms: North Tier 1 (Clean, 2m wait, accessible), East Tier 2 (Cleaning, 15m wait).
        - Food: Grand Food Bazaar (West concourse, 18m wait), Cafe Express (East, 4m wait).
        - Parking: Zone A (North, 86% full), Zone B (East, 50% full), Zone C (West, 98% full).
        - Gates: Gate A, B, C, D, E. Gate B is currently congested (22m wait). Gate A and D have low queues (3m wait).
      `;

      const result = await model.generateContent(`${systemContext}\n\nUser Question: ${message}`);
      const text = result.response.text();
      return res.json({ response: text, provider: 'gemini' });
    } catch (e) {
      console.warn("Gemini execution failed, falling back to local simulation:", e.message);
    }
  }

  // Fallback to offline rule dictionary
  let reply = MULTILINGUAL_ANSWERS[langKey].default;
  if (prompt.includes('seat') || prompt.includes('a-120') || prompt.includes('ಆಸನ') || prompt.includes('సీట్') || prompt.includes('सीट') || prompt.includes('இருக்கை')) {
    reply = MULTILINGUAL_ANSWERS[langKey].seat;
  } else if (prompt.includes('gate') || prompt.includes('ಗೇಟ್') || prompt.includes('గేట్') || prompt.includes('गेट') || prompt.includes('வாயில்')) {
    reply = MULTILINGUAL_ANSWERS[langKey].gate;
  } else if (prompt.includes('park') || prompt.includes('ಪಾರ್ಕಿಂಗ್') || prompt.includes('పార్కింగ్') || prompt.includes('पार्किंग') || prompt.includes('பார்க்கிங்')) {
    reply = MULTILINGUAL_ANSWERS[langKey].parking;
  } else if (prompt.includes('food') || prompt.includes('buy') || prompt.includes('খাদ্য') || prompt.includes('ఆహారం') || prompt.includes('भोजन') || prompt.includes('உணவு')) {
    reply = MULTILINGUAL_ANSWERS[langKey].food;
  } else if (prompt.includes('washroom') || prompt.includes('restroom') || prompt.includes('toilet') || prompt.includes('ಶೌಚಾಲಯ') || prompt.includes('వాష్ రూమ్') || prompt.includes('शौचालय') || prompt.includes('கழிவறை')) {
    reply = MULTILINGUAL_ANSWERS[langKey].washroom;
  } else if (prompt.includes('exit') || prompt.includes('reach') || prompt.includes('ಮಾರ್ಗ') || prompt.includes('నిష్క్రమణ') || prompt.includes('निकास') || prompt.includes('வெளியேறும்')) {
    reply = MULTILINGUAL_ANSWERS[langKey].exit;
  }

  return res.json({ response: reply, provider: 'mock_local' });
});

// 2. Multilingual Announcement Generator Route
router.post('/translate', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text prompt required' });
  }

  const cleanText = text.toLowerCase().trim();

  // If Gemini API Key is configured, attempt to use it for translations
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        Translate the following stadium announcement into English, Telugu, Hindi, Tamil, and Kannada.
        Keep the translations accurate and polite.
        Return ONLY a JSON object containing the translations with keys: english, telugu, hindi, tamil, kannada.
        Do not wrap the response in markdown code blocks.
        Announcement: "${text}"
      `;

      const result = await model.generateContent(prompt);
      let textResult = result.response.text().trim();
      // Clean up markdown wrapper codeblocks if Gemini added them
      if (textResult.startsWith('```')) {
        textResult = textResult.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }
      const jsonRes = JSON.parse(textResult);
      return res.json({ translations: jsonRes, provider: 'gemini' });
    } catch (e) {
      console.warn("Gemini translation failed, falling back to local simulation:", e.message);
    }
  }

  // Fallback translating using presets or generic translation templates
  let translations = PRESET_TRANSLATIONS[cleanText];
  if (!translations) {
    // Generate dynamic mock translation
    translations = {
      english: text,
      telugu: `అనౌన్స్మెంట్: [Telugu] ${text}`,
      hindi: `घोषणा: [Hindi] ${text}`,
      tamil: `அறிவிப்பு: [Tamil] ${text}`,
      kannada: `ಘೋಷಣೆ: [Kannada] ${text}`
    };
  }

  return res.json({ translations, provider: 'mock_local' });
});

// 3. Graph Routing Navigation Route
router.post('/routing', (req, res) => {
  const { startNode, endNode, routingType = 'fastest' } = req.body;

  if (!startNode || !endNode) {
    return res.status(400).json({ error: 'Start and end nodes are required' });
  }

  const route = findShortestPath(startNode, endNode, routingType);

  if (!route) {
    return res.status(404).json({ error: 'No suitable route found with the selected preferences' });
  }

  return res.json(route);
});

// 4. Predictive Crowd & Wait Times Analytics Route
router.post('/predict', async (req, res) => {
  const { weatherCondition = 'Clear', currentMatchSpectators = 68000 } = req.body;

  // AI-driven simulation of time-series occupancy levels
  const hourlyOccupancy = [
    { hour: '14:00', occupancy: Math.round(currentMatchSpectators * 0.1), risk: 10, waitTimeGateB: 2 },
    { hour: '15:00', occupancy: Math.round(currentMatchSpectators * 0.25), risk: 15, waitTimeGateB: 5 },
    { hour: '16:00', occupancy: Math.round(currentMatchSpectators * 0.45), risk: 20, waitTimeGateB: 8 },
    { hour: '17:00', occupancy: Math.round(currentMatchSpectators * 0.70), risk: 38, waitTimeGateB: 12 },
    { hour: '18:00', occupancy: Math.round(currentMatchSpectators * 0.92), risk: 65, waitTimeGateB: 22 },
    { hour: '19:00', occupancy: Math.round(currentMatchSpectators * 0.98), risk: 45, waitTimeGateB: 4 }, // Crowd settled
    { hour: '20:00', occupancy: Math.round(currentMatchSpectators * 0.99), risk: 25, waitTimeGateB: 2 },
    { hour: '21:00', occupancy: Math.round(currentMatchSpectators * 0.85), risk: 50, waitTimeGateB: 8 }, // Leaving early
    { hour: '22:00', occupancy: Math.round(currentMatchSpectators * 0.20), risk: 80, waitTimeGateB: 25 }, // Dispersal peak
  ];

  let recommendation = "Gate B is reaching 92% capacity due to high flow rate (230 spectators/min) from Parking Zone B. Reasoning: Parking Zone A is full, forcing driver arrivals at Zone B, and Gate B is the closest entry arch. Action: Shift 4 security officers to Gate B, redirect East Concourse spectators to Gate D (North-West), and open Gate E's VVIP overflow lane.";
  
  if (weatherCondition.toLowerCase() === 'rainy' || weatherCondition.toLowerCase() === 'rain') {
    recommendation = "Heavy rain expected shortly (intensity: 15mm/hr). Canopy shutters are opening. Shaded seating areas are open to all. Reasoning: Wet conditions increase walking slip hazards by 60% and cause ticket check slow-downs. Action: Deploy 8 volunteers with rain gear to Gate C and B, open all exit escalators, and divert spectators to undercover concourses.";
  } else if (weatherCondition.toLowerCase() === 'hot' || weatherCondition.toLowerCase() === 'sunny') {
    recommendation = "Extreme temperature warning (34°C). Canopy shutters are closing to shade Tier 3. Reasoning: Upper Tier stands have direct solar exposure, raising heatstroke risks by 40%. Action: Deploy 2 medical patrols to Upper Level 3 stands, open additional hydration stations at North and East concourses, and distribute free water cups.";
  }

  // If Gemini API Key is configured, attempt to use it for rich recommendations
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        Synthesize stadium crowd management recommendations. 
        Weather: "${weatherCondition}". Spectator count: ${currentMatchSpectators}.
        Identify congestion risk levels. Provide 2-3 precise natural language operational action items.
        You MUST structure every recommendation in this format:
        "Reasoning: [Explanation of crowds/risks based on sensors] Action: [Operational instruction details]"
      `;

      const result = await model.generateContent(prompt);
      recommendation = result.response.text().trim();
    } catch (e) {
      console.warn("Gemini prediction failed, falling back to local simulation:", e.message);
    }
  }

  return res.json({
    hourlyOccupancy,
    recommendation,
    peakHour: '18:00',
    riskLevel: currentMatchSpectators > 60000 ? 'High' : 'Medium',
    resourceDemand: {
      volunteers: currentMatchSpectators > 60000 ? 120 : 60,
      security: currentMatchSpectators > 60000 ? 180 : 90,
      medicalTeams: currentMatchSpectators > 60000 ? 12 : 6,
    }
  });
});

export default router;

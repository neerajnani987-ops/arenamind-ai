import { Router } from 'express';
import { findShortestPath, STADIUM_NODES } from '../routing/dijkstra.js';

const router = Router();

// 3. Graph Routing Navigation Route
router.post('/routing', (req, res, next) => {
  try {
    const { startNode, endNode, routingType = 'fastest' } = req.body;

    if (!startNode || !endNode || typeof startNode !== 'string' || typeof endNode !== 'string') {
      return res.status(400).json({ error: 'Valid start and end node strings are required' });
    }
    if (typeof routingType !== 'string' || !['fastest', 'least_crowded', 'wheelchair'].includes(routingType)) {
      return res.status(400).json({ error: 'Invalid routing type parameter' });
    }
    if (!STADIUM_NODES[startNode] || !STADIUM_NODES[endNode]) {
      return res.status(400).json({ error: 'Start or end node does not exist in stadium configurations' });
    }

    const route = findShortestPath(startNode, endNode, routingType);

    if (!route) {
      return res.status(404).json({ error: 'No suitable route found with the selected preferences' });
    }

    return res.json(route);
  } catch (err) {
    next(err);
  }
});

export default router;

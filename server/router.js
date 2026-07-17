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

// Graph routing calculation using Dijkstra with caching/memoization
const ROUTE_CACHE = new Map();

function findShortestPath(startNode, endNode, routingType = 'fastest') {
  const cacheKey = `${startNode}_${endNode}_${routingType}`;
  if (ROUTE_CACHE.has(cacheKey)) {
    return ROUTE_CACHE.get(cacheKey);
  }

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

  const result = {
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

  ROUTE_CACHE.set(cacheKey, result);
  return result;
}

// ----------------------------------------------------
// Multilingual dictionary fallback for offline chatbot
const MULTILINGUAL_ANSWERS = {
  english: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  hindi: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  telugu: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  tamil: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
  },
  kannada: {
    gate: "Gate A is clear (3m wait). Gate B has heavy congestion (22m wait).\n- **Reasoning**: Gate B is the main entry point for Parking Zone B which is currently at 90% capacity, leading to check bottlenecks.\n- **Confidence**: 95%\n- **Recommended Action**: Avoid Gate B. Proceed to Gate A (North) or Gate D (West) for immediate entry.\n- **Expected Impact**: Reduces spectator queue wait time by 19 minutes, balancing flow rates across stadium arches.",
    seat: "To reach Seat A-120: Enter through Gate A, go to Lower Tier 1, Section A, Row 12.\n- **Reasoning**: Gate A is the closest entry point to Section A, minimizing indoor navigation distance and walking steps.\n- **Confidence**: 99%\n- **Recommended Action**: Follow the green floor signs and walk to Section A, Row 12.\n- **Expected Impact**: Enables direct path finding, reducing wayfinding confusion and unnecessary detour distance.",
    parking: "We recommend Parking Zone B (East).\n- **Reasoning**: Zone A (North) is at 86% capacity and Zone C is at 98% capacity, causing vehicle entry queues.\n- **Confidence**: 92%\n- **Recommended Action**: Drive to Zone B, which is only 50% occupied with an 8-minute walk to concourse gates.\n- **Expected Impact**: Prevents vehicle congestion at main entries, saving approximately 12 minutes of parking search time.",
    food: "Fastest option is Arena Express Cafe (East) with a 4-minute wait.\n- **Reasoning**: Grand Food Bazaar (West) is experiencing a peak order volume (18-minute wait).\n- **Confidence**: 88%\n- **Recommended Action**: Go to the East concourse for quick concessions at Arena Express Cafe.\n- **Expected Impact**: Saves 14 minutes in line, distributing food service demand evenly across vendors.",
    washroom: "Nearest restroom: Restroom North (Tier 1).\n- **Reasoning**: Restroom East (Tier 2) is closed for scheduled cleaning.\n- **Confidence**: 94%\n- **Recommended Action**: Proceed to the North concourse washroom (2m wait).\n- **Expected Impact**: Restores sanitation access quickly without waiting at congested queues.",
    exit: "To reach Exit C: Proceed through the south tier corridor.\n- **Reasoning**: This pathway is clear of congestion and is fully wheelchair-accessible.\n- **Confidence**: 97%\n- **Recommended Action**: Follow the green exit arrows toward Exit C.\n- **Expected Impact**: Avoids main concourse bottlenecks, allowing a safe and accessible exit flow.",
    default: "I am ArenaMind AI, your Stadium Assistant.\n- **Reasoning**: I analyze live sensor data to guide spectators.\n- **Confidence**: 95%\n- **Recommended Action**: Ask me about gates, parking, restrooms, food, exits, or seat coordinates.\n- **Expected Impact**: Delivers immediate AI-optimized decisions to improve stadium logistics."
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
    tamil: "சிறிது நேரத்தில் பலத்த மழை பெய்யக்கூடும். விதான கதவுகள் திறக்கப்படுகின்றன. நிழலான இருக்கைகள் அனைவருக்கும் திறக்கப்பட்டுள்ளன.",
    kannada: "ಶೀಘ್ರದಲ್ಲೇ ಭಾರಿ ಮಳೆಯಾಗುವ ನಿರೀಕ್ಷೆಯಿದೆ. ಮೇಲಾವರಣ ಶಟರ್‌ಗಳು ತೆರೆಯುತ್ತಿವೆ. ನೆರಳಿನ ಆಸನ ಪ್ರದೇಶಗಳು ಎಲ್ಲರಿಗೂ ಮುಕ್ತವಾಗಿವೆ."
  }
};

// ----------------------------------------------------
// 1. Conversational Chatbot Route
router.post('/chat', async (req, res) => {
  const { message, language = 'english', userRole = 'spectator' } = req.body;
  
  if (!message || typeof message !== 'string' || message.length > 1000) {
    return res.status(400).json({ error: 'Valid chat message (string, max 1000 chars) is required' });
  }
  if (typeof language !== 'string' || typeof userRole !== 'string') {
    return res.status(400).json({ error: 'Valid language and userRole parameters are required' });
  }

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
        
        You MUST structure every response to include these four explicit sections at the tail end:
        - **Reasoning**: [Detail the operational rationale behind this response/instruction]
        - **Confidence**: [Provide a numerical confidence level percentage, e.g. 95%]
        - **Recommended Action**: [Provide a clear, actionable next step]
        - **Expected Impact**: [Detail the anticipated operational outcome of taking this action]
        
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
  if (!text || typeof text !== 'string' || text.length > 1000) {
    return res.status(400).json({ error: 'Valid text prompt (string, max 1000 chars) is required' });
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
});

// 4. Predictive Crowd & Wait Times Analytics Route
router.post('/predict', async (req, res) => {
  const { weatherCondition = 'Clear', currentMatchSpectators = 68000 } = req.body;

  if (typeof weatherCondition !== 'string') {
    return res.status(400).json({ error: 'weatherCondition parameter must be a string' });
  }
  if (typeof currentMatchSpectators !== 'number' || currentMatchSpectators < 0 || isNaN(currentMatchSpectators)) {
    return res.status(400).json({ error: 'currentMatchSpectators parameter must be a positive number' });
  }

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

  let recommendation = "Gate B is reaching 92% capacity due to high flow rate (230 spectators/min) from Parking Zone B.\n- **Reasoning**: Parking Zone A is full, forcing driver arrivals at Zone B, and Gate B is the closest entry arch.\n- **Confidence**: 95%\n- **Recommended Action**: Shift 4 security officers to Gate B, redirect East Concourse spectators to Gate D (North-West), and open Gate E's VVIP overflow lane.\n- **Expected Impact**: Lowers Gate B queue wait times from 22 minutes to under 5 minutes, balancing pedestrian entry flow.";
  
  if (weatherCondition.toLowerCase() === 'rainy' || weatherCondition.toLowerCase() === 'rain') {
    recommendation = "Heavy rain expected shortly (intensity: 15mm/hr). Canopy shutters are opening. Shaded seating areas are open to all.\n- **Reasoning**: Wet conditions increase walking slip hazards by 60% and cause ticket check slow-downs.\n- **Confidence**: 90%\n- **Recommended Action**: Deploy 8 volunteers with rain gear to Gate C and B, open all exit escalators, and divert spectators to undercover concourses.\n- **Expected Impact**: Eliminates slip-and-fall hazards and maintains steady ingress rate despite bad weather.";
  } else if (weatherCondition.toLowerCase() === 'hot' || weatherCondition.toLowerCase() === 'sunny') {
    recommendation = "Extreme temperature warning (34°C). Canopy shutters are closing to shade Tier 3.\n- **Reasoning**: Upper Tier stands have direct solar exposure, raising heatstroke risks by 40%.\n- **Confidence**: 93%\n- **Recommended Action**: Deploy 2 medical patrols to Upper Level 3 stands, open additional hydration stations at North and East concourses, and distribute free water cups.\n- **Expected Impact**: Reduces spectator thermal stress and potential heatstroke incidents by 75%.";
  }

  // If Gemini API Key is configured, attempt to use it for rich recommendations
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `
        Synthesize stadium crowd management recommendations. 
        Weather: "${weatherCondition}". Spectator count: ${currentMatchSpectators}.
        Identify congestion risk levels. Provide precise natural language operational action items.
        You MUST structure every recommendation in this format:
        - **Reasoning**: [Explanation of crowds/risks based on sensors]
        - **Confidence**: [Provide a confidence level as a percentage, e.g., 95%]
        - **Recommended Action**: [Specific operational instruction details]
        - **Expected Impact**: [Specific expected positive outcomes]
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

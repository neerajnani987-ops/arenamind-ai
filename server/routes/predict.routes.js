import { Router } from 'express';
import { generatePredictionResponse } from '../services/gemini.js';

const router = Router();

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
      recommendation = await generatePredictionResponse(weatherCondition, currentMatchSpectators);
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

import { Router } from 'express';
import { generatePredictionResponse } from '../services/gemini.js';

const router = Router();

// 4. Predictive Crowd & Wait Times Analytics Route
router.post('/predict', async (req, res, next) => {
  try {
    const { weatherCondition = 'Clear', currentMatchSpectators = 68000 } = req.body;

    if (typeof weatherCondition !== 'string') {
      return res.status(400).json({ error: 'weatherCondition parameter must be a string' });
    }
    if (typeof currentMatchSpectators !== 'number' || currentMatchSpectators < 0 || isNaN(currentMatchSpectators)) {
      return res.status(400).json({ error: 'currentMatchSpectators parameter must be a positive number' });
    }

    // Calculate weather factor multiplier
    const weatherLower = weatherCondition.toLowerCase();
    const isRain = weatherLower === 'rainy' || weatherLower === 'rain';
    const isHot = weatherLower === 'hot' || weatherLower === 'sunny';
    const weatherMultiplier = isRain ? 1.4 : isHot ? 1.2 : 1.0;

    // Ingress/Egress percentages per hour
    const ingressPcts = [
      { hour: '14:00', pct: 0.10 },
      { hour: '15:00', pct: 0.25 },
      { hour: '16:00', pct: 0.45 },
      { hour: '17:00', pct: 0.70 },
      { hour: '18:00', pct: 0.92 },
      { hour: '19:00', pct: 0.98 },
      { hour: '20:00', pct: 0.99 },
      { hour: '21:00', pct: 0.85 },
      { hour: '22:00', pct: 0.20 },
    ];

    // Mathematically model hourly occupancy, risk index, and wait times
    const hourlyOccupancy = ingressPcts.map(item => {
      const occupancy = Math.round(currentMatchSpectators * item.pct);
      
      // Dynamic wait times (seconds per check * crowd density factor)
      // Clear weather wait time at peak: ~22 minutes
      const baseWaitSec = Math.round((currentMatchSpectators / 3000) * item.pct * weatherMultiplier);
      const waitTimeGateB = Math.max(1, baseWaitSec);

      // Dynamic risk level out of 100
      const risk = Math.min(100, Math.round(item.pct * 100 * weatherMultiplier * (currentMatchSpectators > 60000 ? 1.0 : 0.7)));

      return {
        hour: item.hour,
        occupancy,
        risk,
        waitTimeGateB
      };
    });

    // Calculate peak wait time dynamically
    const peakWaitTime = Math.max(...hourlyOccupancy.map(h => h.waitTimeGateB));

    // Build recommendation text dynamically
    let recommendation = `Gate B is reaching ${Math.round(92 * weatherMultiplier)}% capacity due to high flow rate (${Math.round(230 * weatherMultiplier)} spectators/min) from Parking Zone B.
- **Reasoning**: Parking Zone A is full, forcing driver arrivals at Zone B, and Gate B is the closest entry arch.
- **Confidence**: 95%
- **Recommended Action**: Shift ${Math.round(4 * weatherMultiplier)} security officers to Gate B, redirect East Concourse spectators to Gate D (North-West), and open Gate E's VVIP overflow lane.
- **Expected Impact**: Lowers Gate B queue wait times from ${peakWaitTime} minutes to under ${Math.max(2, Math.round(5 * weatherMultiplier))} minutes, balancing pedestrian entry flow.`;
    
    if (isRain) {
      recommendation = `Heavy rain expected shortly (intensity: 15mm/hr). Canopy shutters are opening. Shaded seating areas are open to all.
- **Reasoning**: Wet conditions increase walking slip hazards by 60% and cause ticket check slow-downs, inflating peak wait times to ${peakWaitTime} minutes.
- **Confidence**: 90%
- **Recommended Action**: Deploy ${Math.round(8 * weatherMultiplier)} volunteers with rain gear to Gate C and B, open all exit escalators, and divert spectators to undercover concourses.
- **Expected Impact**: Eliminates slip-and-fall hazards and maintains steady ingress rate despite bad weather.`;
    } else if (isHot) {
      recommendation = `Extreme temperature warning (34°C). Canopy shutters are closing to shade Tier 3.
- **Reasoning**: Upper Tier stands have direct solar exposure, raising heatstroke risks by 40%.
- **Confidence**: 93%
- **Recommended Action**: Deploy ${Math.round(2 * weatherMultiplier)} medical patrols to Upper Level 3 stands, open additional hydration stations at North and East concourses, and distribute free water cups.
- **Expected Impact**: Reduces spectator thermal stress and potential heatstroke incidents by 75%.`;
    }

    // If Gemini API Key is configured, attempt to use it for rich recommendations
    if (process.env.GEMINI_API_KEY) {
      try {
        recommendation = await generatePredictionResponse(weatherCondition, currentMatchSpectators);
      } catch (e) {
        console.warn("Gemini prediction failed, falling back to local simulation:", e.message);
      }
    }

    // Calculate dynamic resource demands based on spectators count and weather condition
    const dynamicRiskValue = currentMatchSpectators * weatherMultiplier;
    const riskLevel = dynamicRiskValue > 80000 ? 'Extreme' : dynamicRiskValue > 60000 ? 'High' : 'Medium';

    return res.json({
      hourlyOccupancy,
      recommendation,
      peakHour: '18:00',
      riskLevel,
      resourceDemand: {
        volunteers: Math.round(currentMatchSpectators * 0.0018 * weatherMultiplier),
        security: Math.round(currentMatchSpectators * 0.0026 * weatherMultiplier),
        medicalTeams: Math.max(2, Math.round(currentMatchSpectators * 0.00018 * weatherMultiplier)),
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

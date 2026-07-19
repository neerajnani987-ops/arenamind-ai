import { describe, it, expect } from 'vitest';
process.env.PORT = '5000';
import request from 'supertest';
import app from '../server.js';

describe('Predict API Routes', () => {
  it('should compute predictions dynamically based on spectator count and weather', async () => {
    // 1. In clear weather, 50k spectators
    const resClear50k = await request(app)
      .post('/api/predict')
      .send({ weatherCondition: 'Clear', currentMatchSpectators: 50000 });
    expect(resClear50k.status).toBe(200);
    expect(resClear50k.body.resourceDemand.security).toBe(130); // 50000 * 0.0026 * 1.0
    expect(resClear50k.body.riskLevel).toBe('Medium'); // 50k * 1.0 = 50k (<= 60k)

    // 2. In rainy weather, 80k spectators
    const resRainy80k = await request(app)
      .post('/api/predict')
      .send({ weatherCondition: 'Rainy', currentMatchSpectators: 80000 });
    expect(resRainy80k.status).toBe(200);
    // Rainy multiplier is 1.4
    // Security: 80000 * 0.0026 * 1.4 = 291
    expect(resRainy80k.body.resourceDemand.security).toBe(291);
    expect(resRainy80k.body.riskLevel).toBe('Extreme'); // 80k * 1.4 = 112k (> 80k)

    // Verify recommendations string changes
    expect(resClear50k.body.recommendation).toContain('Gate B is reaching 92% capacity');
    expect(resRainy80k.body.recommendation).toContain('Heavy rain expected shortly');
  });
});

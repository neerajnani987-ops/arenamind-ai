import { describe, it, expect, vi, afterEach } from 'vitest';
process.env.PORT = '5000';
import request from 'supertest';
import app from '../server.js';

vi.mock('../services/gemini.js', () => ({
  generateChatResponse: vi.fn().mockResolvedValue('Mocked Gemini chat response\n- **Reasoning**: Mock reasoning\n- **Confidence**: 95%\n- **Recommended Action**: Mock action\n- **Expected Impact**: Mock impact'),
  generateTranslationResponse: vi.fn().mockResolvedValue('{"english": "hello", "telugu": "హలో"}')
}));

describe('Chat API Routes', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv;
  });

  it('should return 200 with telemetry and with GEMINI_API_KEY', async () => {
    process.env.GEMINI_API_KEY = 'fake_key';
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'where is gate a',
        language: 'english',
        userRole: 'spectator',
        telemetry: { gates: [{ id: 'gate-a', waitTime: 5 }] }
      });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('gemini');
    expect(res.body.response).toContain('Mocked Gemini');
  });

  it('should return 200 without telemetry and with GEMINI_API_KEY', async () => {
    process.env.GEMINI_API_KEY = 'fake_key';
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'where is gate a',
        language: 'english',
        userRole: 'spectator'
      });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('gemini');
    expect(res.body.response).toContain('Mocked Gemini');
  });

  it('should return 200 with telemetry and without GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'where is gate a',
        language: 'english',
        userRole: 'spectator',
        telemetry: { gates: [{ id: 'gate-a', waitTime: 12 }] }
      });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('mock_local');
    expect(res.body.response).toContain('Gate A');
    expect(res.body.response).toContain('12m wait');
  });

  it('should return 200 without telemetry and without GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'where is gate a',
        language: 'english',
        userRole: 'spectator'
      });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('mock_local');
    expect(res.body.response).toContain('Gate A');
  });
});

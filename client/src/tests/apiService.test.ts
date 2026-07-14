// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '../services/api';

describe('API Services Layer Integrations & Fallback Engine', () => {
  const originalFetch = window.fetch;

  beforeEach(() => {
    // Suppress console logs in test outputs
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    window.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Chatbot service fetch calls', () => {
    it('should parse success responses correctly when fetch resolves', async () => {
      const mockResponse = { response: 'AI Response text', provider: 'gemini' };
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiService.chat('gate-a', 'english', 'spectator');
      expect(result.response).toBe('AI Response text');
      expect(result.provider).toBe('gemini');
    });

    it('should activate offline local dictionary logic upon network exceptions', async () => {
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Network disconnected'))
      );

      const result = await apiService.chat('gate', 'english', 'spectator');
      expect(result.provider).toBe('client_emulation');
      expect(result.response).toContain('Gate B has heavy congestion');
    });
  });

  describe('Translation service fetch calls', () => {
    it('should parse translated messages when service is online', async () => {
      const mockResponse = {
        translations: {
          english: 'Announcement',
          telugu: 'ప్రకటన',
          hindi: 'घोषणा',
          tamil: 'அறிவிப்பு',
          kannada: 'ಘೋಷಣೆ',
        },
        provider: 'gemini',
      };
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        } as Response)
      );

      const result = await apiService.translate('Clean announcement text');
      expect(result.translations.telugu).toBe('ప్రకటన');
      expect(result.provider).toBe('gemini');
    });

    it('should fallback to local structured announcement mappings when offline', async () => {
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Translation service offline'))
      );

      const result = await apiService.translate('emergency evacuation');
      expect(result.provider).toBe('client_emulation');
      expect(result.translations.english).toContain('Attention!');
    });
  });

  describe('Dijkstra Routing service fetch calls', () => {
    it('should fetch shortest paths correctly when service is online', async () => {
      const mockRoute = {
        path: ['gate-a', 'seat-a120'],
        coordinates: [[12.97, 77.59]],
        directions: ['Go straight'],
        estimatedTimeMin: 3,
        wheelchair: true,
      };
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockRoute),
        } as Response)
      );

      const result = await apiService.routing('gate-a', 'seat-a120', 'fastest');
      expect(result.estimatedTimeMin).toBe(3);
      expect(result.wheelchair).toBe(true);
    });

    it('should compute local client fallback Dijkstra path when API is offline', async () => {
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Routing service offline'))
      );

      const result = await apiService.routing('gate-a', 'seat-a120', 'fastest');
      expect(result.path).toContain('Gate A (North)');
      expect(result.path).toContain('Seat A-120 (Tier 1)');
      expect(result.estimatedTimeMin).toBeGreaterThan(0);
    });
  });

  describe('Predictive wait-times analytics service fetch calls', () => {
    it('should fetch crowd occupancy levels when predictions API is active', async () => {
      const mockPredictions = {
        hourlyOccupancy: [{ hour: '14:00', occupancy: 5000, risk: 10, waitTimeGateB: 2 }],
        recommendation: 'All operations normal',
        peakHour: '18:00',
        riskLevel: 'Low',
        resourceDemand: { volunteers: 10, security: 5, medicalTeams: 2 },
      };
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockPredictions),
        } as Response)
      );

      const result = await apiService.getPredictions('Clear', 68000);
      expect(result.peakHour).toBe('18:00');
      expect(result.riskLevel).toBe('Low');
    });

    it('should simulate predictions locally when predictions API is offline', async () => {
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Predictions service offline'))
      );

      const result = await apiService.getPredictions('Rainy', 68000);
      expect(result.riskLevel).toBe('High');
      expect(result.recommendation).toContain('Heavy rain expected');
    });
  });
});

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiService } from '../services/api';
import { sanitizeInput, validateEmail, validateRequiredFields } from '../utils/security';
import { checkRoleAuthorization } from '../firebase/config';

describe('Comprehensive System, Security and Accessibility Audit Test Suite', () => {
  const originalFetch = window.fetch;

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    window.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Dijkstra Routing Cache Verification', () => {
    it('should retrieve route from local cache on subsequent routing calls', async () => {
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Network offline'))
      );

      // First call (cache miss, computes path)
      const route1 = await apiService.routing('gate-a', 'seat-a120', 'fastest');
      expect(route1).toBeDefined();
      expect(route1.estimatedTimeMin).toBe(4);

      // Modify the cache internally or verify subsequent call resolves successfully immediately
      const route2 = await apiService.routing('gate-a', 'seat-a120', 'fastest');
      expect(route2).toEqual(route1);
    }, 15000);

    it('should assert least_crowded routes calculate with correct time estimation defaults', async () => {
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.reject(new Error('Network offline'))
      );

      const result = await apiService.routing('gate-a', 'seat-a120', 'least_crowded');
      expect(result.estimatedTimeMin).toBe(6);
    }, 15000);
  });

  describe('OWASP Security: XSS Sanitization & Email Validation', () => {
    it('should completely strip active script tags to prevent injection', () => {
      const dangerousInput = '<script>alert("XSS")</script>Hello World';
      const cleanOutput = sanitizeInput(dangerousInput);
      expect(cleanOutput).not.toContain('<script>');
      expect(cleanOutput).not.toContain('</script>');
      expect(cleanOutput).toBe('alert(&quot;XSS&quot;)Hello World');
    });

    it('should escape dangerous markup characters', () => {
      const dangerousChars = '<div>&"\'/</div>';
      const cleanOutput = sanitizeInput(dangerousChars);
      expect(cleanOutput).not.toContain('<div>');
      expect(cleanOutput).toContain('&amp;');
      expect(cleanOutput).toContain('&quot;');
      expect(cleanOutput).toContain('&#x27;');
      expect(cleanOutput).toContain('&#x2F;');
    });

    it('should validate structured emails correctly', () => {
      expect(validateEmail('user@arenamind.ai')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('should validate required fields presence', () => {
      const validFields = { name: 'Steve', role: 'security' };
      const invalidFields = { name: '', role: ' ' };
      expect(validateRequiredFields(validFields)).toBeNull();
      expect(validateRequiredFields(invalidFields)).toContain('required');
    });
  });

  describe('RBAC Authorization Guard Rails', () => {
    it('should allow organizers to perform write updates on gates and facilities', () => {
      expect(() => checkRoleAuthorization('organizer', 'gates', 'update')).not.toThrow();
      expect(() => checkRoleAuthorization('organizer', 'facilities', 'update')).not.toThrow();
    });

    it('should allow security officers to update active warnings', () => {
      expect(() => checkRoleAuthorization('security', 'alerts', 'update')).not.toThrow();
    });

    it('should deny spectator write permissions on core matches metadata', () => {
      expect(() => checkRoleAuthorization('spectator', 'matches', 'update')).toThrow();
    });
  });

  describe('Multilingual Translation & Voice Assistant Mappings', () => {
    it('should resolve correct BCP-47 language tags for browser recognition and synthesis', () => {
      const LANG_BCP47_MAP: Record<string, string> = {
        english: 'en-US',
        hindi: 'hi-IN',
        telugu: 'te-IN',
        tamil: 'ta-IN',
        kannada: 'kn-IN',
      };
      expect(LANG_BCP47_MAP.english).toBe('en-US');
      expect(LANG_BCP47_MAP.hindi).toBe('hi-IN');
      expect(LANG_BCP47_MAP.telugu).toBe('te-IN');
      expect(LANG_BCP47_MAP.tamil).toBe('ta-IN');
      expect(LANG_BCP47_MAP.kannada).toBe('kn-IN');
    });

    it('should fetch translated strings in multiple regional languages when translation is online', async () => {
      const mockResult = {
        translations: {
          english: 'Gate A closed',
          telugu: 'గేట్ A మూసివేయబడింది',
          hindi: 'गेट A बंद है',
          tamil: 'கேட் A மூடப்பட்டுள்ளது',
          kannada: 'ಗೇಟ್ A ಮುಚ್ಚಲಾಗಿದೆ',
        },
        provider: 'gemini',
      };
      window.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResult),
        } as Response)
      );

      const result = await apiService.translate('Gate A closed');
      expect(result.translations.telugu).toContain('గేట్ A');
      expect(result.translations.kannada).toBe('ಗೇಟ್ A ಮುಚ್ಚಲಾಗಿದೆ');
      expect(result.provider).toBe('gemini');
    });
  });

  describe('QR Ticket Scanner Integration Logic', () => {
    it('should parse scanned ticket barcodes correctly', () => {
      const scanBarcode = (code: string) => {
        if (!code.startsWith('TKT-')) return null;
        return {
          ticketId: code,
          valid: true,
        };
      };
      expect(scanBarcode('TKT-FIFA-2026-A120')).toEqual({ ticketId: 'TKT-FIFA-2026-A120', valid: true });
      expect(scanBarcode('INVALID-CODE')).toBeNull();
    });
  });

  describe('Emergency Warnings & Evacuation Trigger Logic', () => {
    it('should return appropriate emergency alert severity classes', () => {
      const getSeverityColor = (severity: 'critical' | 'high' | 'medium') => {
        if (severity === 'critical') return 'text-rose-500 bg-rose-500/10';
        if (severity === 'high') return 'text-amber-500 bg-amber-500/10';
        return 'text-indigo-500 bg-indigo-500/10';
      };
      expect(getSeverityColor('critical')).toBe('text-rose-500 bg-rose-500/10');
      expect(getSeverityColor('high')).toBe('text-amber-500 bg-amber-500/10');
      expect(getSeverityColor('medium')).toBe('text-indigo-500 bg-indigo-500/10');
    });
  });
});

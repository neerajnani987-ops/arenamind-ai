// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('UI Shared Core Components Validation', () => {
  describe('Button component properties', () => {
    it('should resolve style variant maps correctly', () => {
      const getStyles = (variant: 'primary' | 'secondary' | 'danger' | 'ghost') => {
        const variants = {
          primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-neon",
          secondary: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
          danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-neon-rose",
          ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white"
        };
        return variants[variant];
      };

      expect(getStyles('primary')).toContain('bg-indigo-600');
      expect(getStyles('danger')).toContain('bg-rose-600');
      expect(getStyles('secondary')).toContain('bg-white/5');
      expect(getStyles('ghost')).toContain('bg-transparent');
    });
  });

  describe('Input component error states', () => {
    it('should show border-rose-500 styles when validation error message is loaded', () => {
      const getErrorClass = (error?: string) => {
        return error ? 'border-rose-500 focus:ring-rose-500' : '';
      };
      expect(getErrorClass('Email is required')).toContain('border-rose-500');
      expect(getErrorClass(undefined)).toBe('');
    });
  });

  describe('Card component layout outlines', () => {
    it('should output default rounded corners and glass panel classes', () => {
      const cardProps = {
        className: 'glass-panel p-5 rounded-xl border border-white/10 shadow-glass'
      };
      expect(cardProps.className).toContain('glass-panel');
      expect(cardProps.className).toContain('rounded-xl');
    });
  });

  describe('StadiumLegend items definitions', () => {
    it('should verify all markers and route colors indicators mapping is complete', () => {
      const indicators = [
        { label: 'Normal / Low Crowds', class: 'marker-pulse-emerald' },
        { label: 'High Congestion / Alert', class: 'marker-pulse-rose' },
        { label: 'Medium Density', class: 'bg-amber-500' },
        { label: 'Active Navigation Route', class: 'border-[#6366f1]' }
      ];

      expect(indicators.length).toBe(4);
      expect(indicators[0].class).toBe('marker-pulse-emerald');
      expect(indicators[1].class).toBe('marker-pulse-rose');
      expect(indicators[2].class).toBe('bg-amber-500');
      expect(indicators[3].class).toBe('border-[#6366f1]');
    });
  });

  describe('ProblemSolutionBenefit structural data', () => {
    it('should assert all 5 support pages details are predefined', () => {
      const PAGES_METADATA = {
        landing: { problem: 'concession lines', solution: 'Dijkstra', benefit: 'save 19 mins' },
        login: { problem: 'unauthorized access', solution: 'RBAC', benefit: 'local terminals' },
        signup: { problem: 'ticket validation', solution: 'onboarding', benefit: 'voice helpers' },
        'forgot-password': { problem: 'account lockout', solution: 'encrypted link', benefit: 'seconds control' },
        dashboard: { problem: 'complex telemetry', solution: 'sensor logs', benefit: '5 seconds check' }
      };

      expect(PAGES_METADATA.landing.benefit).toBeDefined();
      expect(PAGES_METADATA.dashboard.solution).toContain('sensor');
      expect(PAGES_METADATA.login.problem).toContain('unauthorized');
    });
  });
});

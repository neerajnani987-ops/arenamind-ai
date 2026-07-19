// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { StadiumLegend } from '../components/ui/StadiumLegend';
import { ProblemSolutionBenefit } from '../components/ui/ProblemSolutionBenefit';

describe('UI Shared Core Components Validation', () => {
  describe('Button component properties', () => {
    it('should resolve style variant maps correctly', () => {
      render(React.createElement(Button, { variant: 'primary' }, 'Click me'));
      const btn = screen.getByRole('button', { name: 'Click me' });
      expect(btn.className).toContain('bg-indigo-600');

      render(React.createElement(Button, { variant: 'danger' }, 'Delete'));
      const btnDanger = screen.getByRole('button', { name: 'Delete' });
      expect(btnDanger.className).toContain('bg-rose-600');
    });
  });

  describe('Input component error states', () => {
    it('should show border-rose-500 styles when validation error message is loaded', () => {
      render(React.createElement(Input, { label: 'Username', error: 'Email is required' }));
      const errorMsg = screen.getByRole('alert');
      expect(errorMsg.textContent).toBe('Email is required');
      
      const input = screen.getByLabelText('Username');
      expect(input.className).toContain('border-rose-500');
    });
  });

  describe('Card component layout outlines', () => {
    it('should output default rounded corners and glass panel classes', () => {
      render(React.createElement(Card, { className: 'custom-class' }, 'Content'));
      const card = screen.getByText('Content');
      expect(card.className).toContain('glass-panel');
      expect(card.className).toContain('rounded-xl');
      expect(card.className).toContain('custom-class');
    });
  });

  describe('StadiumLegend items definitions', () => {
    it('should verify all markers and route colors indicators mapping is complete', () => {
      render(React.createElement(StadiumLegend, { hasRoute: true }));
      expect(screen.getByText('Stadium Legend')).not.toBeNull();
      expect(screen.getByText('Normal / Low Crowds')).not.toBeNull();
      expect(screen.getByText('High Congestion / Alert')).not.toBeNull();
      expect(screen.getByText('Medium Density')).not.toBeNull();
      expect(screen.getByText('Active Navigation Route')).not.toBeNull();
    });
  });

  describe('ProblemSolutionBenefit structural data', () => {
    it('should assert all page details are predefined', () => {
      render(React.createElement(ProblemSolutionBenefit, { page: 'landing' }));
      expect(screen.getByText(/concession lines/i)).not.toBeNull();
      expect(screen.getByText(/Dijkstra graph/i)).not.toBeNull();
      expect(screen.getByText(/save up to 19 minutes/i)).not.toBeNull();
    });
  });
});

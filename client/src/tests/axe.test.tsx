// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { BrowserRouter } from 'react-router-dom';

import { SpectatorDashboard } from '../pages/roles/SpectatorDashboard';
import { AdminDashboard } from '../pages/roles/AdminDashboard';
import { SecurityDashboard } from '../pages/roles/SecurityDashboard';
import { MedicalDashboard } from '../pages/roles/MedicalDashboard';
import { OrganizerDashboard } from '../pages/roles/OrganizerDashboard';
import { VolunteerDashboard } from '../pages/roles/VolunteerDashboard';

// Mock StadiumMap to prevent Leaflet browser environment crashes
vi.mock('../components/StadiumMap', () => ({
  StadiumMap: () => React.createElement('div', { 'data-testid': 'mock-stadium-map' }, 'Mock Stadium Map'),
  default: () => React.createElement('div', { 'data-testid': 'mock-stadium-map' }, 'Mock Stadium Map')
}));

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => React.createElement('div', {}, children),
  LineChart: ({ children }: any) => React.createElement('div', {}, children),
  AreaChart: ({ children }: any) => React.createElement('div', {}, children),
  BarChart: ({ children }: any) => React.createElement('div', {}, children),
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  Area: () => null,
  Bar: () => null,
}));

const wrap = (component: React.ReactElement) => {
  return React.createElement(BrowserRouter, {}, component);
};

describe('Axe Accessibility Audits', () => {
  it('should pass accessibility checks for SpectatorDashboard', async () => {
    const { container } = render(wrap(React.createElement(SpectatorDashboard)));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should pass accessibility checks for AdminDashboard', async () => {
    const { container } = render(wrap(React.createElement(AdminDashboard)));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should pass accessibility checks for SecurityDashboard', async () => {
    const { container } = render(wrap(React.createElement(SecurityDashboard)));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should pass accessibility checks for MedicalDashboard', async () => {
    const { container } = render(wrap(React.createElement(MedicalDashboard)));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should pass accessibility checks for OrganizerDashboard', async () => {
    const { container } = render(wrap(React.createElement(OrganizerDashboard)));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('should pass accessibility checks for VolunteerDashboard', async () => {
    const { container } = render(wrap(React.createElement(VolunteerDashboard)));
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

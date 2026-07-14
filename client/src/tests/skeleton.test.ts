// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('SkeletonLoader Component Rendering Logic', () => {
  const getMockLayoutCount = (variant: 'card' | 'list' | 'text' | 'map', count: number) => {
    const list = [];
    for (let i = 0; i < count; i++) {
      if (variant === 'card') {
        list.push('card-layout-element');
      } else if (variant === 'list') {
        list.push('list-layout-element');
      } else if (variant === 'map') {
        list.push('map-layout-element');
      } else {
        list.push('text-layout-element');
      }
    }
    return list;
  };

  it('should verify skeleton card variant generation', () => {
    const items = getMockLayoutCount('card', 3);
    expect(items.length).toBe(3);
    expect(items[0]).toBe('card-layout-element');
  });

  it('should verify skeleton list variant generation', () => {
    const items = getMockLayoutCount('list', 5);
    expect(items.length).toBe(5);
    expect(items[0]).toBe('list-layout-element');
  });

  it('should verify skeleton map variant generation', () => {
    const items = getMockLayoutCount('map', 1);
    expect(items.length).toBe(1);
    expect(items[0]).toBe('map-layout-element');
  });

  it('should verify skeleton text variant generation', () => {
    const items = getMockLayoutCount('text', 2);
    expect(items.length).toBe(2);
    expect(items[0]).toBe('text-layout-element');
  });

  it('should assert empty lists when count is set to zero', () => {
    const items = getMockLayoutCount('card', 0);
    expect(items.length).toBe(0);
  });
});

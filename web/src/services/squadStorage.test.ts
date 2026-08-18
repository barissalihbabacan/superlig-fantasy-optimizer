// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { saveOptimizedSquad, loadOptimizedSquad, clearOptimizedSquad } from './squadStorage';
import { OptimizationResult } from './optimizer';

describe('squadStorage', () => {
  const mockResult: OptimizationResult = {
    startingXI: [
      { id: 'p1', name: 'Muslera', team_id: 'galatasaray', position: 'Goalkeeper', price: 600 },
    ],
    bench: [],
    captain: { id: 'p1', name: 'Muslera', team_id: 'galatasaray', position: 'Goalkeeper', price: 600 },
    viceCaptain: null,
    totalPrice: 600,
    totalPoints: 8.5,
    formation: '3-5-2',
  };

  beforeEach(async () => {
    await clearOptimizedSquad();
  });

  it('saves and loads optimized squad successfully', async () => {
    await saveOptimizedSquad(mockResult, '3-5-2');
    const loaded = await loadOptimizedSquad();

    expect(loaded).not.toBeNull();
    expect(loaded?.formation).toBe('3-5-2');
    expect(loaded?.result.totalPoints).toBe(8.5);
    expect(loaded?.result.startingXI.length).toBe(1);
    expect(loaded?.result.startingXI[0].name).toBe('Muslera');
  });

  it('clears optimized squad successfully', async () => {
    await saveOptimizedSquad(mockResult, '3-5-2');
    await clearOptimizedSquad();
    const loaded = await loadOptimizedSquad();

    expect(loaded).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startTrace,
  measureTrace,
  measureOptimizerExecution,
} from './performance';
import * as firebaseServices from './firebase';

describe('Performance Monitoring service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs startTrace and measureTrace safely without errors when performance is null or unsupported', async () => {
    vi.spyOn(firebaseServices, 'initPerformance').mockResolvedValue(null);

    const traceWrapper = await startTrace('null_trace');
    expect(traceWrapper).toBeNull();

    const result = await measureTrace('test_trace', async () => {
      return { success: true, count: 42 };
    });

    expect(result).toEqual({ success: true, count: 42 });
  });

  it('starts and stops custom traces with attributes and metrics when performance is available', async () => {
    const mockTrace = {
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
      putMetric: vi.fn(),
    };

    vi.spyOn(firebaseServices, 'initPerformance').mockResolvedValue({} as never);
    vi.mock('firebase/performance', () => ({
      trace: () => mockTrace,
    }));

    const result = await measureTrace(
      'custom_operation',
      async (traceWrapper) => {
        traceWrapper?.putAttribute('test_attr', 'value');
        traceWrapper?.putMetric('test_metric', 100);
        return 'done';
      },
      {
        attributes: { env: 'test' },
        metrics: { initial_val: 1 },
      }
    );

    expect(result).toBe('done');
  });

  it('measures optimizer execution transparently and records metrics if available', async () => {
    vi.spyOn(firebaseServices, 'initPerformance').mockResolvedValue(null);

    const result = await measureOptimizerExecution('3-5-2', async () => {
      return { totalPoints: 85, formation: '3-5-2' };
    });

    expect(result).toEqual({ totalPoints: 85, formation: '3-5-2' });
  });

  it('handles errors inside traced operations and still ensures trace is stopped', async () => {
    const mockTrace = {
      start: vi.fn(),
      stop: vi.fn(),
      putAttribute: vi.fn(),
      putMetric: vi.fn(),
    };

    vi.spyOn(firebaseServices, 'initPerformance').mockResolvedValue({} as never);
    vi.mock('firebase/performance', () => ({
      trace: () => mockTrace,
    }));

    await expect(
      measureTrace('failing_operation', async () => {
        throw new Error('Operation failed');
      })
    ).rejects.toThrow('Operation failed');
  });
});

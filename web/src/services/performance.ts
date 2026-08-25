import { initPerformance } from './firebase';

export interface CustomTraceWrapper {
  putAttribute: (name: string, value: string) => void;
  putMetric: (name: string, value: number) => void;
  stop: () => void;
}

let perfPromise: Promise<unknown | null> | null = null;

async function getPerformanceInstance(): Promise<unknown | null> {
  if (!perfPromise) {
    perfPromise = initPerformance();
  }
  return perfPromise;
}

/**
 * Starts a custom performance trace safely.
 * Returns a trace wrapper or null if performance monitoring is unavailable.
 */
export async function startTrace(traceName: string): Promise<CustomTraceWrapper | null> {
  try {
    const perf = await getPerformanceInstance();
    if (!perf) return null;

    const { trace } = await import('firebase/performance');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = trace(perf as any, traceName);
    t.start();

    return {
      putAttribute: (name: string, value: string) => {
        try {
          t.putAttribute(name, String(value));
        } catch {
          // ignore attribute errors
        }
      },
      putMetric: (name: string, value: number) => {
        try {
          t.putMetric(name, Math.round(value));
        } catch {
          // ignore metric errors
        }
      },
      stop: () => {
        try {
          t.stop();
        } catch {
          // ignore stop errors
        }
      },
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      console.debug(`[Performance: startTrace failed for ${traceName}]`, err);
    }
    return null;
  }
}

/**
 * Executes an async operation wrapped in a custom Firebase Performance trace.
 * Guarantees that the operation completes and returns even if performance monitoring fails.
 */
export async function measureTrace<T>(
  traceName: string,
  operation: (trace: CustomTraceWrapper | null) => Promise<T>,
  options?: {
    attributes?: Record<string, string>;
    metrics?: Record<string, number>;
  }
): Promise<T> {
  const customTrace = await startTrace(traceName);

  if (customTrace && options?.attributes) {
    Object.entries(options.attributes).forEach(([key, val]) => {
      customTrace.putAttribute(key, val);
    });
  }

  if (customTrace && options?.metrics) {
    Object.entries(options.metrics).forEach(([key, val]) => {
      customTrace.putMetric(key, val);
    });
  }

  try {
    return await operation(customTrace);
  } finally {
    if (customTrace) {
      customTrace.stop();
    }
  }
}

/**
 * Custom trace helper specifically for the computationally heavy squad optimizer execution.
 */
export async function measureOptimizerExecution<T>(
  formation: string,
  operation: () => Promise<T>
): Promise<T> {
  return measureTrace(
    'optimizer_execution',
    async (trace) => {
      const result = await operation();
      if (trace && result && typeof result === 'object' && 'totalPoints' in result) {
        const points = (result as { totalPoints?: number }).totalPoints;
        if (typeof points === 'number') {
          trace.putMetric('total_points', points);
        }
      }
      return result;
    },
    {
      attributes: {
        formation: formation || 'Auto',
      },
    }
  );
}

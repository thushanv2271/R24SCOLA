/**
 * Generic Async Hook for API Calls
 */

import { useState, useEffect, useCallback } from 'react';
import type { AsyncState, LoadingState } from '@/types';

type AsyncFunction<T, Args extends unknown[]> = (...args: Args) => Promise<T>;

interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | undefined>;
  reset: () => void;
}

/**
 * Generic hook for handling async operations
 */
export const useAsync = <T, Args extends unknown[] = []>(
  asyncFunction: AsyncFunction<T, Args>,
  options: UseAsyncOptions = {}
): UseAsyncReturn<T, Args> => {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    status: 'idle',
    error: null,
  });

  /**
   * Execute async function
   */
  const execute = useCallback(
    async (...args: Args): Promise<T | undefined> => {
      setState((prev) => ({ ...prev, status: 'loading', error: null }));

      try {
        const data = await asyncFunction(...args);
        setState({ data, status: 'success', error: null });

        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));

        if (onError && err instanceof Error) {
          onError(err);
        }

        return undefined;
      }
    },
    [asyncFunction, onSuccess, onError]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({ data: null, status: 'idle', error: null });
  }, []);

  /**
   * Execute immediately if specified
   */
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset,
  };
};

export default useAsync;

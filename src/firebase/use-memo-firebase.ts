'use client';

import { useMemo, type DependencyList } from 'react';

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) {
    return memoized;
  }

  // Use a type assertion to tell TypeScript it's safe to add the property.
  const result = memoized as MemoFirebase<T>;
  result.__memo = true;

  return result;
}


'use client';

import dynamic, { type DynamicOptions, type Loader } from 'next/dynamic';
import { type ComponentType } from 'react';

/**
 * A robust wrapper around next/dynamic that handles both default and named exports gracefully.
 *
 * @param loader A function that returns a promise of the module to be imported.
 * @param pick An optional string specifying the named export to pick from the module.
 * @param options Optional Next.js dynamic import options.
 * @returns A dynamically loaded React component.
 */
export function dynamicPick<P extends {}>(
  loader: Loader<P>,
  pick?: string,
  options?: DynamicOptions<P>
) {
  return dynamic(async () => {
    const mod = await loader();
    // Try default first; if not, pick named; else pick the first exported value.
    if (pick) return mod[pick];
    return mod.default || Object.values(mod)[0];
  }, { ssr: false, loading: () => null, ...options });
}

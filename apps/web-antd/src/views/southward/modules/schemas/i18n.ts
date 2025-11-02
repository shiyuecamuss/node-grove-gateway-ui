import type { Nullable } from '@vben/types';

import { preferences } from '@vben/preferences';

import { isNullOrUndefined } from './index';

export type UiText =
  | { kind: 'localized'; locales: Record<string, string> }
  | { kind: 'simple'; value: string };

function unique<T>(arr: T[]): T[] {
  const set = new Set<T>();
  const res: T[] = [];
  for (const a of arr) {
    if (!set.has(a)) {
      set.add(a);
      res.push(a);
    }
  }
  return res;
}

export function resolveUiText(
  t: Nullable<UiText>,
  locale?: string,
  fallbacks?: string[],
): string {
  if (isNullOrUndefined(t)) return '';
  if (t.kind === 'simple') return t.value ?? '';

  const current = locale || preferences.app.locale || 'en-US';
  const chain: string[] = unique(
    [current, ...(fallbacks ?? ['en-US', 'zh-CN'])].filter(Boolean) as string[],
  );

  if (t.kind === 'localized') {
    const locales = t.locales || {};
    // exact and base-lang prefix matching
    for (const lang of chain) {
      if (locales[lang]) return locales[lang];
      const foundKey = Object.keys(locales).find(
        (k) =>
          k.toLowerCase() === lang.toLowerCase() ||
          k.toLowerCase().startsWith(lang.toLowerCase()),
      );
      if (foundKey) return locales[foundKey] || '';
    }
    const any = Object.values(locales)[0];
    return typeof any === 'string' ? any : '';
  }

  return '';
}

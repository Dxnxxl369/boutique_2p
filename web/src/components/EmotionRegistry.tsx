'use client';

import * as React from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';

export default function EmotionRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ cache, flush }] = React.useState(() => {
    const emotionCache = createCache({ key: 'mui', prepend: true });
    emotionCache.compat = true;
    const previousInsert = emotionCache.insert;
    let inserted: string[] = [];

    emotionCache.insert = (...args) => {
      const [, serialized] = args;
      if (emotionCache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return previousInsert(...args);
    };

    const flush = () => {
      const prev = inserted;
      inserted = [];
      return prev;
    };

    return { cache: emotionCache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }

    const styles: string[] = [];
    for (const name of names) {
      const style = cache.inserted[name];
      if (typeof style === 'string') {
        styles.push(style);
      }
    }

    if (styles.length === 0) {
      return null;
    }

    return (
      <style
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles.join('') }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

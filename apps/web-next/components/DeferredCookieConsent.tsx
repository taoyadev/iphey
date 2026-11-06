'use client';

import { useEffect, useState, type ComponentType } from 'react';

export function DeferredCookieConsent() {
  const [Component, setComponent] = useState<ComponentType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const loaded = await import('@/components/CookieConsent');
      if (!cancelled) {
        setComponent(() => loaded.CookieConsent);
      }
    };

    const onFirstIntent = () => {
      void load();
      remove();
    };

    const remove = () => {
      window.removeEventListener('pointerdown', onFirstIntent);
      window.removeEventListener('keydown', onFirstIntent);
      window.removeEventListener('scroll', onFirstIntent);
    };

    window.addEventListener('pointerdown', onFirstIntent, { once: true, passive: true });
    window.addEventListener('keydown', onFirstIntent, { once: true });
    window.addEventListener('scroll', onFirstIntent, { once: true, passive: true });

    return () => {
      cancelled = true;
      remove();
    };
  }, []);

  return Component ? <Component /> : null;
}

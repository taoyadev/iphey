'use client';
import { useEffect, useRef } from 'react';

interface ScreenReaderAnnouncerProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearOnUnmount?: boolean;
}

/**
 * Live region for screen reader announcements
 * Announces dynamic content changes to screen readers
 */
export const ScreenReaderAnnouncer = ({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
}: ScreenReaderAnnouncerProps) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const region = regionRef.current;
    if (region && message) {
      region.textContent = '';
      const timeout = setTimeout(() => {
        region.textContent = message;
      }, 100);

      return () => {
        clearTimeout(timeout);
        if (clearOnUnmount && region) {
          region.textContent = '';
        }
      };
    }

    return () => {
      if (clearOnUnmount && region) {
        region.textContent = '';
      }
    };
  }, [message, clearOnUnmount]);

  return <div ref={regionRef} role="status" aria-live={politeness} aria-atomic="true" className="sr-only" />;
};

/**
 * Skip to content link for keyboard navigation
 */
export const SkipToContentLink = ({ targetId = 'main-content' }: { targetId?: string }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-slate-900 focus:rounded-lg focus:font-semibold focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
};

/**
 * Visually hidden but available to screen readers
 */
export const VisuallyHidden = ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className="sr-only" {...props}>
      {children}
    </span>
  );
};

'use client';
import { useEffect, useRef } from 'react';
import { drawCanvasSample } from '@/lib/fingerprint';
export default function CanvasSample() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        drawCanvasSample(ref.current);
      } catch {
        /* Observation status remains authoritative. */
      }
    }
  }, []);
  return (
    <figure>
      <canvas
        ref={ref}
        width={300}
        height={150}
        className="max-w-full rounded-lg bg-white"
        role="img"
        aria-label="Canvas test drawing: orange iphey canvas fingerprint text on a transparent background"
      />
      <figcaption className="mt-2 text-xs text-slate-400">
        The drawing used by this probe, rendered again for inspection. The recorded hash belongs to the completed
        measurement.
      </figcaption>
    </figure>
  );
}

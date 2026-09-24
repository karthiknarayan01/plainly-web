"use client";

import { useEffect, useRef, useState } from "react";

export const MAX_READER_WIDTH = 720;
/** Below this a page is unreadable anyway, and it keeps a transiently
 * small or unmeasured container from propagating a width the renderers
 * treat as "don't draw". */
export const MIN_READER_WIDTH = 240;

/**
 * Measures the width available to a reader's content column, capped at
 * MAX_READER_WIDTH. Both the PDF and text readers use this same value for
 * layout (and, for text, for pagination) so what's measured for rendering
 * and what's paginated against never drift apart.
 */
export function useContentWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(MAX_READER_WIDTH);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const measured = el.clientWidth;
      // A container that hasn't been laid out yet (or is momentarily
      // collapsed) reports 0, and `0 - 32` is negative. Every page
      // renderer skips a non-positive width, and skips it *silently* —
      // which surfaces as a reader full of blank pages with nothing in
      // the console to explain it. Hold the last sensible width instead
      // of propagating one that means "draw nothing".
      if (measured <= 0) return;
      setWidth(
        Math.max(
          Math.min(measured - 32, MAX_READER_WIDTH),
          MIN_READER_WIDTH
        )
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width } as const;
}

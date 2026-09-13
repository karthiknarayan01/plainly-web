"use client";

import { useEffect, useRef, useState } from "react";

export const MAX_READER_WIDTH = 720;

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
    const update = () =>
      setWidth(Math.min(el.clientWidth - 32, MAX_READER_WIDTH));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width } as const;
}

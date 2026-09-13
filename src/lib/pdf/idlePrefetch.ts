type IdleWindow = Window &
  typeof globalThis & {
    requestIdleCallback?: (
      callback: () => void,
      opts?: { timeout: number }
    ) => number;
    cancelIdleCallback?: (id: number) => void;
  };

/** requestIdleCallback with a setTimeout fallback (Safari support varies). */
export function scheduleIdle(callback: () => void): () => void {
  const w = window as IdleWindow;
  if (typeof w.requestIdleCallback === "function") {
    const id = w.requestIdleCallback(callback, { timeout: 500 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 1);
  return () => window.clearTimeout(id);
}

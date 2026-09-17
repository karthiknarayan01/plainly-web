"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { PageFrame } from "./PageFrame";
import type { PageContentRenderer, PageSource } from "./types";

const OVERSCAN = 2;

interface ReaderPagerProps {
  pageCount: number;
  getPageSource: (index: number) => PageSource;
  estimateSize: (index: number) => number;
  renderer: PageContentRenderer;
  contentWidth: number;
  zoom: number;
  initialPageIndex?: number;
  onCurrentPageChange?: (index: number) => void;
}

interface VirtualPageItemProps {
  virtualItem: VirtualItem;
  isVisible: boolean;
  getPageSource: (index: number) => PageSource;
  renderer: PageContentRenderer;
  contentWidth: number;
  zoom: number;
  measureElement: (el: Element | null) => void;
  registerPageEl: (index: number, el: Element | null) => void;
}

// Its own component (rather than an inline map callback) so `setRef` below
// stays referentially stable across parent re-renders — an inline ref
// callback gets a new identity every render, which makes React tear down
// and re-attach every mounted page's ref (and thus its IntersectionObserver
// registration) on every re-render, not just when a page actually
// mounts/unmounts.
function VirtualPageItem({
  virtualItem,
  isVisible,
  getPageSource,
  renderer: Renderer,
  contentWidth,
  zoom,
  measureElement,
  registerPageEl,
}: VirtualPageItemProps) {
  const { index } = virtualItem;

  const setRef = useCallback(
    (el: Element | null) => {
      measureElement(el);
      registerPageEl(index, el);
    },
    [index, measureElement, registerPageEl]
  );

  return (
    <div
      data-index={index}
      ref={setRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translate3d(0, ${virtualItem.start}px, 0)`,
      }}
    >
      <PageFrame>
        <Renderer
          source={getPageSource(index)}
          width={contentWidth}
          isVisible={isVisible}
          renderPriority={isVisible ? "high" : "idle"}
          zoom={zoom}
        />
      </PageFrame>
    </div>
  );
}

export function ReaderPager({
  pageCount,
  getPageSource,
  estimateSize,
  renderer,
  contentWidth,
  zoom,
  initialPageIndex = 0,
  onCurrentPageChange,
}: ReaderPagerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElsRef = useRef<Map<number, Element>>(new Map());
  const didInitialScroll = useRef(false);

  const virtualizer = useVirtualizer({
    count: pageCount,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    overscan: OVERSCAN,
  });

  useEffect(() => {
    if (didInitialScroll.current || initialPageIndex === 0) return;
    didInitialScroll.current = true;
    virtualizer.scrollToIndex(initialPageIndex, { align: "start" });
  }, [initialPageIndex, virtualizer]);

  // A second, narrower IntersectionObserver scoped to only the pages
  // react-virtual has currently mounted: which one is "current" for the
  // toolbar, and (via renderPriority) which get full-priority vs idle
  // rendering. react-virtual owns mount/unmount + scroll math; this owns
  // fine-grained visibility within that mounted set.
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Work out the most-visible page BEFORE touching state. This used
        // to live inside the setVisibleIndices updater, which meant
        // onCurrentPageChange — a parent setState, driving the toolbar's
        // page counter — was called from inside it. A state updater has
        // to be pure: React can run it during render, and updating a
        // different component from there logs "Cannot update a component
        // while rendering a different component" and risks a dropped
        // update. Confirmed firing on every real scroll before this.
        let mostVisible: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!mostVisible || entry.intersectionRatio > mostVisible.ratio) {
            mostVisible = { index, ratio: entry.intersectionRatio };
          }
        }

        setVisibleIndices((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const index = Number((entry.target as HTMLElement).dataset.index);
            if (entry.isIntersecting) next.add(index);
            else next.delete(index);
          }
          return next;
        });

        if (mostVisible) onCurrentPageChange?.(mostVisible.index);
      },
      { root, threshold: [0, 0.5, 1] }
    );
    observerRef.current = observer;
    for (const el of observedElsRef.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [onCurrentPageChange]);

  const registerPageEl = useCallback((index: number, el: Element | null) => {
    const prev = observedElsRef.current.get(index);
    if (prev && observerRef.current) observerRef.current.unobserve(prev);
    if (el) {
      observedElsRef.current.set(index, el);
      observerRef.current?.observe(el);
    } else {
      observedElsRef.current.delete(index);
      // A page that's no longer observed can't report "not intersecting"
      // again, so it must be cleared here — otherwise a page marked
      // visible once would stay "visible" (and high-priority) forever.
      setVisibleIndices((prev) => {
        if (!prev.has(index)) return prev;
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="relative h-full overflow-y-auto"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <VirtualPageItem
            key={virtualItem.key}
            virtualItem={virtualItem}
            isVisible={visibleIndices.has(virtualItem.index)}
            getPageSource={getPageSource}
            renderer={renderer}
            contentWidth={contentWidth}
            zoom={zoom}
            measureElement={virtualizer.measureElement}
            registerPageEl={registerPageEl}
          />
        ))}
      </div>
    </div>
  );
}

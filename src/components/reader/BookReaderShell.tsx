"use client";

import { useState } from "react";
import { ReaderToolbar } from "./ReaderToolbar";
import { ReaderPager } from "./ReaderPager";
import type { PageContentRenderer, PageSource } from "./types";

interface BookReaderShellProps {
  title: string;
  pageCount: number;
  getPageSource: (index: number) => PageSource;
  estimateSize: (index: number) => number;
  renderer: PageContentRenderer;
  contentWidth: number;
  onClose: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function BookReaderShell({
  title,
  pageCount,
  getPageSource,
  estimateSize,
  renderer,
  contentWidth,
  onClose,
  zoom,
  onZoomChange,
}: BookReaderShellProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (pageCount === 0) {
    return (
      <div className="flex h-full flex-col">
        <ReaderToolbar
          title={title}
          currentPage={0}
          pageCount={0}
          onClose={onClose}
        />
        <div className="flex flex-1 items-center justify-center text-foreground-subtle text-sm">
          This document has no pages to show.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ReaderToolbar
        title={title}
        currentPage={currentPage}
        pageCount={pageCount}
        onClose={onClose}
        zoom={zoom}
        onZoomChange={onZoomChange}
      />
      <div className="flex-1 min-h-0">
        <ReaderPager
          pageCount={pageCount}
          getPageSource={getPageSource}
          estimateSize={estimateSize}
          renderer={renderer}
          contentWidth={contentWidth}
          zoom={zoom ?? 1}
          onCurrentPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

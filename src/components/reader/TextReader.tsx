"use client";

import { useCallback, useState } from "react";
import { BookReaderShell } from "./BookReaderShell";
import { TextPageRenderer } from "./renderers/TextPageRenderer";
import { useContentWidth } from "./useContentWidth";
import { useTextPaginator } from "@/lib/text/useTextPaginator";
import type { RewriteResponseBody } from "@/lib/rewrite/types";
import type { PageContentRenderer, PageSource } from "./types";

interface TextReaderProps {
  rewrite: RewriteResponseBody;
  /**
   * Height/width of a page in the source PDF. The rewritten reader lays
   * its pages out to the same shape as the document the reader just came
   * from, so switching between "read the original" and the rewrite isn't
   * a jump between two different-looking apps.
   */
  sourcePageAspect: number;
  /** Total pages in the source PDF, so the reader can say how much of the
   *  document has arrived. Pages are revealed strictly in order, so while
   *  the worker is still going the reader legitimately holds fewer pages
   *  than the document has — without saying so, that looks like the rest
   *  was lost. */
  sourcePageCount: number;
  onClose: () => void;
}

export default function TextReader({
  rewrite,
  sourcePageAspect,
  sourcePageCount,
  onClose,
}: TextReaderProps) {
  const { ref, width: contentWidth } = useContentWidth();
  const [zoom, setZoom] = useState(1);

  // Pagination is deliberately computed at zoom-independent size. A PDF
  // page doesn't reflow when you zoom it — the same words stay on the
  // same page and everything just gets bigger — so text pages are
  // paginated once against the unzoomed page box and then scaled for
  // display. Paginating against the zoomed box instead would reflow the
  // whole document on every zoom click, which is exactly the thing that
  // makes a text reader feel unlike a PDF viewer.
  const pageHeight = contentWidth * sourcePageAspect;
  const pages = useTextPaginator(rewrite.sections, contentWidth, pageHeight);

  const getPageSource = useCallback(
    (index: number): PageSource => ({
      kind: "text",
      page: pages[index],
      pageAspect: sourcePageAspect,
    }),
    [pages, sourcePageAspect]
  );

  // Same formula as PdfReader's: the laid-out height of a page at the
  // current zoom.
  const estimateSize = useCallback(
    () => contentWidth * zoom * sourcePageAspect,
    [contentWidth, zoom, sourcePageAspect]
  );

  return (
    <div ref={ref} className="flex-1 min-h-0">
      {pages.length > 0 ? (
        <BookReaderShell
          title={
            rewrite.sections.length < sourcePageCount
              ? `${rewrite.sourceFileName} — Plain Language · ${rewrite.sections.length} of ${sourcePageCount} pages ready…`
              : `${rewrite.sourceFileName} — Plain Language`
          }
          pageCount={pages.length}
          getPageSource={getPageSource}
          estimateSize={estimateSize}
          renderer={TextPageRenderer as PageContentRenderer}
          contentWidth={contentWidth}
          onClose={onClose}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-foreground-subtle text-sm">
          Preparing document…
        </div>
      )}
    </div>
  );
}

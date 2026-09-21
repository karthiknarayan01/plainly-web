"use client";

import { useCallback, useState } from "react";
import { BookReaderShell } from "./BookReaderShell";
import { RewritePageRenderer } from "./renderers/RewritePageRenderer";
import { useContentWidth } from "./useContentWidth";
import { useTextPaginator } from "@/lib/text/useTextPaginator";
import type { RewriteResponseBody } from "@/lib/rewrite/types";
import type { PDFDocumentProxy } from "@/lib/pdf/pdfjsClient";
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
  /** The open source PDF. Original pages are drawn live from it, so no
   *  artwork has to be extracted, uploaded or stored anywhere. */
  doc: PDFDocumentProxy;
  /** Source pages whose text advertises a figure or table; each is shown
   *  in full after the prose rewritten from it. */
  illustratedPages: ReadonlySet<number>;
  onClose: () => void;
}

export default function TextReader({
  rewrite,
  sourcePageAspect,
  doc,
  illustratedPages,
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
  const pages = useTextPaginator(
    rewrite.sections,
    contentWidth,
    pageHeight,
    illustratedPages
  );

  const getPageSource = useCallback(
    (index: number): PageSource => {
      const page = pages[index];
      return page.kind === "original"
        ? {
            kind: "original",
            doc,
            pageNumber: page.sourcePage,
            pageAspect: sourcePageAspect,
          }
        : {
            kind: "text",
            page: { blocks: page.blocks },
            pageAspect: sourcePageAspect,
          };
    },
    [pages, sourcePageAspect, doc]
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
            rewrite.failedPages > 0
              ? `${rewrite.sourceFileName} — Plain Language · ${rewrite.failedPages} page${
                  rewrite.failedPages === 1 ? "" : "s"
                } couldn't be rewritten`
              : `${rewrite.sourceFileName} — Plain Language`
          }
          pageCount={pages.length}
          getPageSource={getPageSource}
          estimateSize={estimateSize}
          renderer={RewritePageRenderer as PageContentRenderer}
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

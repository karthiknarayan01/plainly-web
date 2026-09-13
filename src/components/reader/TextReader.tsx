"use client";

import { useCallback } from "react";
import { BookReaderShell } from "./BookReaderShell";
import { TextPageRenderer } from "./renderers/TextPageRenderer";
import { useContentWidth } from "./useContentWidth";
import { useTextPaginator } from "@/lib/text/useTextPaginator";
import type { RewriteResponseBody } from "@/lib/rewrite/types";
import type { PageContentRenderer, PageSource } from "./types";

interface TextReaderProps {
  rewrite: RewriteResponseBody;
  onClose: () => void;
}

const TEXT_PAGE_HEIGHT = 760;

export default function TextReader({ rewrite, onClose }: TextReaderProps) {
  const { ref, width: contentWidth } = useContentWidth();
  const pages = useTextPaginator(rewrite.sections, contentWidth, TEXT_PAGE_HEIGHT);

  const getPageSource = useCallback(
    (index: number): PageSource => ({ kind: "text", page: pages[index] }),
    [pages]
  );

  const estimateSize = useCallback(() => TEXT_PAGE_HEIGHT, []);

  return (
    <div ref={ref} className="flex-1 min-h-0">
      {pages.length > 0 ? (
        <BookReaderShell
          title={`${rewrite.sourceFileName} — Plain Language`}
          pageCount={pages.length}
          getPageSource={getPageSource}
          estimateSize={estimateSize}
          renderer={TextPageRenderer as PageContentRenderer}
          contentWidth={contentWidth}
          onClose={onClose}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-foreground-subtle text-sm">
          Preparing document…
        </div>
      )}
    </div>
  );
}

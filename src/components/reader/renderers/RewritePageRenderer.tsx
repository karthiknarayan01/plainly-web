"use client";

import { PdfPageRenderer } from "./PdfPageRenderer";
import { TextPageRenderer } from "./TextPageRenderer";
import type { PageContentRendererProps, PageSource } from "../types";

type RewriteSource = Extract<PageSource, { kind: "text" | "original" }>;

/**
 * Picks the right renderer for a page of the rewrite.
 *
 * Most pages are rewritten prose. Some are an original page of the source
 * PDF, reproduced so its diagrams, tables and equations survive a process
 * that otherwise only carries text — drawn by the very same canvas
 * renderer the "read the original" view uses, so it looks identical.
 */
export function RewritePageRenderer(props: PageContentRendererProps<RewriteSource>) {
  if (props.source.kind === "original") {
    const { doc, pageNumber } = props.source;
    return (
      <PdfPageRenderer
        {...props}
        source={{ kind: "pdf", doc, pageNumber }}
      />
    );
  }
  return <TextPageRenderer {...props} source={props.source} />;
}

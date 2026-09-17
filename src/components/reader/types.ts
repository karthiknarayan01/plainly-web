import type { ComponentType } from "react";
import type { PDFDocumentProxy } from "@/lib/pdf/pdfjsClient";
import type { TextPage } from "@/lib/text/paginateText";

export type PageSource =
  | { kind: "pdf"; doc: PDFDocumentProxy; pageNumber: number }
  // pageAspect (height/width) travels with the page so a rewritten page
  // can be drawn to the same shape as the source PDF's pages. The pager
  // forwards only `source`, `width` and `zoom` to a renderer, so page
  // geometry has to arrive this way.
  | { kind: "text"; page: TextPage; pageAspect: number };

export type RenderPriority = "high" | "idle" | "deferred";

export interface PageContentRendererProps<T extends PageSource = PageSource> {
  source: T;
  /** Content-box width in CSS px available to render into. */
  width: number;
  isVisible: boolean;
  renderPriority: RenderPriority;
  zoom: number;
}

export type PageContentRenderer<T extends PageSource = PageSource> =
  ComponentType<PageContentRendererProps<T>>;

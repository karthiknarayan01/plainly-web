import type { ComponentType } from "react";
import type { PDFDocumentProxy } from "@/lib/pdf/pdfjsClient";
import type { TextPage } from "@/lib/text/paginateText";

export type PageSource =
  | { kind: "pdf"; doc: PDFDocumentProxy; pageNumber: number }
  | { kind: "text"; page: TextPage };

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

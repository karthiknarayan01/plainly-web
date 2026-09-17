"use client";

import { useMemo } from "react";
import type { RewriteSection } from "@/lib/rewrite/types";
import {
  flattenSections,
  paginateBlocks,
  withOriginalPages,
  type ReaderPage,
} from "./paginateText";

export function useTextPaginator(
  sections: RewriteSection[],
  contentWidth: number,
  contentHeight: number,
  illustratedPages: ReadonlySet<number>
): ReaderPage[] {
  return useMemo(() => {
    if (contentWidth <= 0 || contentHeight <= 0) return [];
    const paginated = paginateBlocks(
      flattenSections(sections),
      contentWidth,
      contentHeight
    );
    return withOriginalPages(paginated, illustratedPages);
  }, [sections, contentWidth, contentHeight, illustratedPages]);
}

"use client";

import { useMemo } from "react";
import type { RewriteSection } from "@/lib/rewrite/types";
import { flattenSections, paginateBlocks, type TextPage } from "./paginateText";

export function useTextPaginator(
  sections: RewriteSection[],
  contentWidth: number,
  contentHeight: number
): TextPage[] {
  return useMemo(() => {
    if (contentWidth <= 0 || contentHeight <= 0) return [];
    return paginateBlocks(flattenSections(sections), contentWidth, contentHeight);
  }, [sections, contentWidth, contentHeight]);
}

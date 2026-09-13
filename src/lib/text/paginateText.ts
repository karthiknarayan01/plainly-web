import type { RewriteSection } from "@/lib/rewrite/types";

export interface TextBlock {
  type: "heading" | "paragraph";
  text: string;
}

export interface TextPage {
  blocks: TextBlock[];
}

export function flattenSections(sections: RewriteSection[]): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const section of sections) {
    blocks.push({ type: "heading", text: section.heading });
    for (const paragraph of section.paragraphs) {
      blocks.push({ type: "paragraph", text: paragraph });
    }
  }
  return blocks;
}

/**
 * Paginates at paragraph/heading granularity (a block never splits across
 * pages) by measuring against an offscreen element that shares the exact
 * CSS classes ("plainly-text-page", "plainly-text-heading",
 * "plainly-text-paragraph", defined in globals.css) used by the live
 * TextPageRenderer — the measurement is only valid if those stay in sync.
 *
 * Runs synchronously since mocked rewrites are a handful of short
 * paragraphs; a real backend producing long documents should chunk this
 * with scheduleIdle (see lib/pdf/idlePrefetch.ts) rather than paginate the
 * whole thing upfront.
 */
export function paginateBlocks(
  blocks: TextBlock[],
  contentWidth: number,
  contentHeight: number
): TextPage[] {
  if (typeof document === "undefined" || blocks.length === 0) {
    return blocks.length > 0 ? [{ blocks }] : [];
  }

  const measurer = document.createElement("div");
  measurer.className = "plainly-text-page";
  measurer.style.position = "fixed";
  measurer.style.top = "0";
  measurer.style.left = "-9999px";
  measurer.style.visibility = "hidden";
  measurer.style.pointerEvents = "none";
  measurer.style.width = `${contentWidth}px`;
  measurer.style.height = "auto";
  document.body.appendChild(measurer);

  const pages: TextPage[] = [];
  let current: TextBlock[] = [];

  const renderBlock = (block: TextBlock) => {
    const el = document.createElement(block.type === "heading" ? "h3" : "p");
    el.className =
      block.type === "heading" ? "plainly-text-heading" : "plainly-text-paragraph";
    el.textContent = block.text;
    return el;
  };

  for (const block of blocks) {
    const el = renderBlock(block);
    measurer.appendChild(el);

    if (measurer.scrollHeight > contentHeight && current.length > 0) {
      measurer.removeChild(el);
      pages.push({ blocks: current });
      measurer.innerHTML = "";
      measurer.appendChild(el);
      current = [block];
    } else {
      current.push(block);
    }
  }
  if (current.length > 0) pages.push({ blocks: current });

  document.body.removeChild(measurer);
  return pages;
}

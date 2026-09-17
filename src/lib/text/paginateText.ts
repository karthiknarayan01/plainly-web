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
    if (section.heading) {
      blocks.push({ type: "heading", text: section.heading });
    }
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

  // Rebuilds the measurer to hold exactly `blocks`, then reports the height.
  const heightOf = (candidate: TextBlock[]) => {
    measurer.innerHTML = "";
    for (const b of candidate) measurer.appendChild(renderBlock(b));
    return measurer.scrollHeight;
  };

  /**
   * Largest word-prefix of `block` that still fits on a page already
   * holding `before`. Returns the prefix (or null if not even one word
   * fits) and whatever is left over.
   *
   * Paragraphs have to be splittable or the layout falls apart: a
   * paragraph is atomic to the packer, so one that doesn't fit in the
   * remaining space gets pushed wholesale to the next page and leaves a
   * void behind it. On real output that produced pages holding three
   * lines followed by half a page of blank, alternating with pages
   * carrying a single fifteen-line block — which is what "the display is
   * horrible" looked like in practice. Splitting mid-paragraph is also
   * just what every real book does at a page break.
   */
  const splitToFit = (
    before: TextBlock[],
    block: TextBlock
  ): [TextBlock | null, TextBlock | null] => {
    const words = block.text.split(/\s+/);
    let lo = 0; // known to fit
    let hi = words.length; // known not to fit
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const candidate = { ...block, text: words.slice(0, mid).join(" ") };
      if (heightOf([...before, candidate]) <= contentHeight) lo = mid;
      else hi = mid - 1;
    }
    if (lo <= 0) return [null, block];
    if (lo >= words.length) return [block, null];
    return [
      { ...block, text: words.slice(0, lo).join(" ") },
      { ...block, text: words.slice(lo).join(" ") },
    ];
  };

  for (const block of blocks) {
    if (heightOf([...current, block]) <= contentHeight) {
      current.push(block);
      continue;
    }

    // A heading shouldn't be split, and shouldn't be stranded alone at the
    // bottom of a page either — move it to the next page whole.
    if (block.type === "heading") {
      if (current.length > 0) pages.push({ blocks: current });
      current = [block];
      continue;
    }

    const [head, firstRest] = splitToFit(current, block);
    let rest = firstRest;
    if (head) current.push(head);
    if (current.length > 0) pages.push({ blocks: current });
    current = [];

    // The remainder may still be taller than a whole empty page; keep
    // slicing off page-sized pieces until what's left fits.
    while (rest && heightOf([rest]) > contentHeight) {
      const [nextHead, nextRest] = splitToFit([], rest);
      if (!nextHead) break; // pathological (a single unbreakable word) — bail
      pages.push({ blocks: [nextHead] });
      rest = nextRest;
    }
    if (rest) current = [rest];
  }
  if (current.length > 0) pages.push({ blocks: current });

  document.body.removeChild(measurer);
  return pages;
}

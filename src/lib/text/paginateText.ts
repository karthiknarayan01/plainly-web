import type { RewriteSection } from "@/lib/rewrite/types";

export interface InlineSpan {
  text: string;
  bold: boolean;
}

/**
 * Splits "**gross margin** is the share…" into bold/plain runs.
 *
 * Both the live renderer and the offscreen measurer below run text
 * through this, so what gets measured is exactly what gets drawn. Bold
 * glyphs are wider than regular ones; measuring plain text and then
 * rendering bold would silently overflow every page that highlights
 * anything.
 */
export function splitBold(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index), bold: false });
    spans.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last), bold: false });
  return spans.length > 0 ? spans : [{ text, bold: false }];
}

/**
 * Closes a bold run that a page break landed inside.
 *
 * Pages split between words, and a highlight can straddle that break —
 * leaving "**gross" at the foot of one page and "margin**" at the head of
 * the next, which renders as literal asterisks in both places. Closing
 * the run on the first page and reopening it on the second keeps the
 * emphasis and the markers balanced.
 */
function balanceBold(
  head: string,
  tail: string,
  block: TextBlock
): [TextBlock, TextBlock] {
  const unclosed = (head.match(/\*\*/g)?.length ?? 0) % 2 === 1;
  return [
    { ...block, text: unclosed ? `${head}**` : head },
    { ...block, text: unclosed ? `**${tail}` : tail },
  ];
}

export interface TextBlock {
  type: "heading" | "paragraph";
  text: string;
  /** Source PDF page this text came from. */
  sourcePage: number;
}

export interface TextPage {
  blocks: TextBlock[];
}

/**
 * What the reader actually pages through: rewritten prose, plus the
 * occasional original page reproduced as-is.
 *
 * A rewrite is text, so every diagram, table and equation in the source
 * would otherwise be dropped. Rather than extract artwork — which proved
 * impossible to locate in a real book, see lib/pdf/extractFigures.ts —
 * the original page is shown after the prose rewritten from it, drawn
 * live from the PDF already in memory.
 */
export type ReaderPage =
  | { kind: "text"; blocks: TextBlock[] }
  | { kind: "original"; sourcePage: number };

export function flattenSections(sections: RewriteSection[]): TextBlock[] {
  const blocks: TextBlock[] = [];
  for (const section of sections) {
    if (section.heading) {
      blocks.push({ type: "heading", text: section.heading, sourcePage: section.sourcePage });
    }
    for (const paragraph of section.paragraphs) {
      blocks.push({ type: "paragraph", text: paragraph, sourcePage: section.sourcePage });
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
    for (const span of splitBold(block.text)) {
      if (span.bold) {
        const strong = document.createElement("strong");
        strong.textContent = span.text;
        el.appendChild(strong);
      } else {
        el.appendChild(document.createTextNode(span.text));
      }
    }
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
    return balanceBold(
      words.slice(0, lo).join(" "),
      words.slice(lo).join(" "),
      block
    );
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

/**
 * Interleaves original source pages into the paginated rewrite.
 *
 * An original page is inserted after the LAST reader page containing text
 * from it, so the diagram arrives once the prose explaining it has been
 * read — not in the middle of it. Pagination still packs prose densely
 * across source-page boundaries, so a source page's text can span several
 * reader pages; only the final one gets the artwork.
 */
export function withOriginalPages(
  pages: TextPage[],
  illustratedPages: ReadonlySet<number>
): ReaderPage[] {
  const out: ReaderPage[] = [];
  for (let i = 0; i < pages.length; i++) {
    out.push({ kind: "text", blocks: pages[i].blocks });

    const here = new Set(pages[i].blocks.map((b) => b.sourcePage));
    const next = new Set((pages[i + 1]?.blocks ?? []).map((b) => b.sourcePage));
    // Ascending, so multiple source pages ending on one reader page keep
    // their original order.
    for (const sourcePage of [...here].sort((a, b) => a - b)) {
      if (!illustratedPages.has(sourcePage)) continue;
      if (next.has(sourcePage)) continue; // this page continues overleaf
      out.push({ kind: "original", sourcePage });
    }
  }
  return out;
}

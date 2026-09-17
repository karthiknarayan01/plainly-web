/**
 * Decides which source pages carry something visual worth showing.
 *
 * Why by caption, and not by finding the drawing: a rewrite drops
 * everything that isn't text, so figures need to come back somehow — but
 * in a real 592-page technical book there is no geometric signal to find
 * them with. Measured, on pages whose captions prove a figure is present:
 * `paints=0 images=0 paths=1` — fewer drawing operations than an ordinary
 * prose page (which runs 1-5 paths of header rules and footer marks).
 * Those figures are drawn as glyphs from an embedded font, so operator-
 * list inspection sees nothing to crop to. Two earlier versions of this
 * file tried exactly that and found either one figure in 120 pages (the
 * cover) or nothing at all.
 *
 * The caption is the signal that actually works: matching "Figure 3.1" and
 * friends against text already extracted for the rewrite found all 19
 * figure pages in that book, with no PDF parsing at all.
 *
 * So rather than cropping to a region that can't be located, the reader
 * shows the whole original page — drawn live from the PDF it already has
 * in memory, by the same renderer the "read the original" view uses.
 * Nothing visual can be lost that way, because nothing is being
 * extracted: the real page is simply shown.
 */

// Caption conventions across technical books and financial filings.
//
// Deliberately unanchored. An earlier version required the caption to
// start a line or follow a sentence end, to avoid catching a passing
// mention like "as Figure 3.1 shows" — and it detected only 4 of 12
// known figure pages, because pdf.js hands over a page as ONE
// space-joined string with no newlines, so almost nothing sits at a
// "line start". (The same flattening broke the contents detector in
// services/worker/main.py.)
//
// Over-including is also the right direction to err in: a page that
// merely mentions a figure costs the reader one extra original page,
// while a missed caption silently loses the diagram — which is the
// complaint this exists to fix.
const CAPTION = /\b(figure|fig\.|table|chart|exhibit|diagram|illustration|plate)\s*\d+([.\-–]\d+)?\b/i;

export function hasIllustration(pageText: string): boolean {
  return CAPTION.test(pageText);
}

/**
 * Source page numbers (1-based) whose text advertises a figure or table.
 */
export function findIllustratedPages(
  pages: { page_number: number; text: string }[]
): number[] {
  return pages.filter((p) => hasIllustration(p.text)).map((p) => p.page_number);
}

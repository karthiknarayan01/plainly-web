import type { PDFDocumentProxy } from "./pdfjsClient";

export interface PageSize {
  width: number;
  height: number;
}

export interface PageSizeUpdate {
  index: number;
  size: PageSize;
}

const CHUNK_SIZE = 20;
// pdf.js viewport dimensions carry float rounding noise even for genuinely
// identical page sizes — an exact-equality check would treat nearly every
// page as "different" and defeat the whole batching strategy below.
const SIZE_EPSILON = 0.5;

/**
 * Computes the (unscaled, scale=1) size of every page. Seeds every entry
 * with page 1's size first (one batched callback for all pages, so a
 * caller can lay out immediately with zero layout shift), then corrects
 * pages that differ, one batched callback per chunk — not one callback per
 * page, which for a several-hundred-page document would trigger that many
 * state updates and reshuffle the virtualizer's layout on nearly every one.
 */
export async function computePageLayout(
  doc: PDFDocumentProxy,
  onPageSizes?: (updates: PageSizeUpdate[]) => void
): Promise<PageSize[]> {
  const numPages = doc.numPages;
  const sizes: PageSize[] = new Array(numPages);

  const firstPage = await doc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  const estimate: PageSize = {
    width: firstViewport.width,
    height: firstViewport.height,
  };
  sizes.fill(estimate);
  onPageSizes?.(
    Array.from({ length: numPages }, (_, index) => ({ index, size: estimate }))
  );

  const remaining = Array.from({ length: numPages }, (_, i) => i).slice(1);
  for (let start = 0; start < remaining.length; start += CHUNK_SIZE) {
    const chunk = remaining.slice(start, start + CHUNK_SIZE);
    const updates: PageSizeUpdate[] = [];
    await Promise.all(
      chunk.map(async (index) => {
        const page = await doc.getPage(index + 1);
        const viewport = page.getViewport({ scale: 1 });
        const size: PageSize = { width: viewport.width, height: viewport.height };
        if (
          Math.abs(size.width - estimate.width) > SIZE_EPSILON ||
          Math.abs(size.height - estimate.height) > SIZE_EPSILON
        ) {
          sizes[index] = size;
          updates.push({ index, size });
        }
      })
    );
    if (updates.length > 0) onPageSizes?.(updates);
  }

  return sizes;
}

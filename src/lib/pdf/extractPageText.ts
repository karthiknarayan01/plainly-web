import type { PDFDocumentProxy } from "./pdfjsClient";

export interface ExtractedPage {
  page_number: number;
  text: string;
}

/**
 * Runs once, after the document loads and before the rewrite request —
 * the backend never parses PDFs itself, it only ever receives text
 * pdf.js has already extracted client-side.
 */
export async function extractPageTexts(
  doc: PDFDocumentProxy
): Promise<ExtractedPage[]> {
  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ page_number: i, text });
  }
  return pages;
}

import * as pdfjsLib from "pdfjs-dist";

let configured = false;

export function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("pdfjs-dist must only be used in the browser");
  }
  if (!configured) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    configured = true;
  }
  return pdfjsLib;
}

export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
export { RenderingCancelledException } from "pdfjs-dist";

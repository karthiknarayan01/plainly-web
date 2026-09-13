import * as pdfjsLib from "pdfjs-dist";

let configured = false;

export function getPdfjs() {
  if (typeof window === "undefined") {
    throw new Error("pdfjs-dist must only be used in the browser");
  }
  if (!configured) {
    // Loaded from a CDN, pinned to the exact installed version, rather than
    // copied into /public at build time — the copy step worked locally but
    // failed unpredictably on Vercel (ENOENT for a file that demonstrably
    // exists in the published npm tarball), most likely a build-cache/
    // filesystem quirk specific to that environment. This sidesteps the
    // whole failure mode and is the standard approach for pdf.js.
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    configured = true;
  }
  return pdfjsLib;
}

export type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
export { RenderingCancelledException } from "pdfjs-dist";

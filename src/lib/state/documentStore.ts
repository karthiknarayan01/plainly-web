import { create } from "zustand";
import type { RewriteResponseBody } from "@/lib/rewrite/types";

export type FlowStatus =
  | "idle"
  | "loading-document"
  | "document-error"
  | "prompt"
  | "rewriting"
  | "rewrite-error"
  | "reading-original"
  | "reading-rewritten";

interface DocumentState {
  status: FlowStatus;
  file: File | null;
  arrayBuffer: ArrayBuffer | null;
  pageCount: number | null;
  rewrite: RewriteResponseBody | null;
  errorMessage: string | null;

  pickFile: (file: File, arrayBuffer: ArrayBuffer) => void;
  documentLoaded: (pageCount: number) => void;
  documentLoadFailed: (message: string) => void;
  chooseReadOriginal: () => void;
  chooseRewrite: () => void;
  rewriteSucceeded: (rewrite: RewriteResponseBody) => void;
  rewriteFailed: (message: string) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  status: "idle",
  file: null,
  arrayBuffer: null,
  pageCount: null,
  rewrite: null,
  errorMessage: null,

  pickFile: (file, arrayBuffer) =>
    set({
      status: "loading-document",
      file,
      arrayBuffer,
      pageCount: null,
      rewrite: null,
      errorMessage: null,
    }),

  documentLoaded: (pageCount) =>
    set({ status: "prompt", pageCount }),

  documentLoadFailed: (message) =>
    set({ status: "document-error", errorMessage: message }),

  chooseReadOriginal: () => set({ status: "reading-original" }),

  chooseRewrite: () => set({ status: "rewriting", errorMessage: null }),

  rewriteSucceeded: (rewrite) =>
    set({ status: "reading-rewritten", rewrite }),

  rewriteFailed: (message) =>
    set({ status: "rewrite-error", errorMessage: message }),

  reset: () =>
    set({
      status: "idle",
      file: null,
      arrayBuffer: null,
      pageCount: null,
      rewrite: null,
      errorMessage: null,
    }),
}));

import type {
  RewriteRequestBody,
  RewriteResponseBody,
  RewriteSection,
} from "./types";

const SECTION_TEMPLATES: RewriteSection[] = [
  {
    heading: "What this document is",
    paragraphs: [
      "This is a placeholder rewrite — plainly-backend doesn't exist yet, so this stands in for the real thing while the reading experience is being built.",
      "Once the real backend is wired up, this page will show a plain-language version of the document you picked, keeping every idea and number from the original but explaining it the way you'd explain it to a friend.",
    ],
  },
  {
    heading: "How the real rewrite will work",
    paragraphs: [
      "The goal is fidelity, not summary: nothing gets left out, nothing gets added, and every claim in the rewrite should trace back to something the original document actually said.",
      "Charts, screenshots, and figures from the source will stay in place, shown alongside the plain-language explanation of what they mean.",
    ],
  },
  {
    heading: "Why this matters for financial statements",
    paragraphs: [
      "Earnings releases and filings are often written in a way that technically discloses everything while making it hard for an ordinary reader to actually follow what's being said.",
      "A rewrite that keeps the substance but drops the jargon should make it possible to read a 10-Q the way you'd read a chapter of a book — start to finish, without needing a finance degree.",
    ],
  },
];

export function buildMockRewrite(
  body: RewriteRequestBody
): RewriteResponseBody {
  const sections = SECTION_TEMPLATES.map((section, index) => ({
    heading: section.heading,
    paragraphs: [
      ...section.paragraphs,
      index === 0
        ? `Source: "${body.fileName}" (${body.pageCount} page${body.pageCount === 1 ? "" : "s"}).`
        : `This is placeholder text, page ${index + 1} of ${SECTION_TEMPLATES.length}.`,
    ],
  }));

  return {
    status: "ok",
    sourceFileName: body.fileName,
    generatedAt: new Date().toISOString(),
    sections,
  };
}

import type { PageContentRendererProps, PageSource } from "../types";

type TextSource = Extract<PageSource, { kind: "text" }>;

/**
 * A rewritten page, drawn to look like the PDF page it replaces: same
 * white sheet, same rounding and shadow as the canvas PdfPageRenderer
 * paints, same page box, and zoom that scales the whole sheet instead of
 * reflowing the text.
 *
 * The inner sheet is laid out at unzoomed size (which is what the
 * paginator measured against) and then transform-scaled, so the words on
 * page 4 stay on page 4 at every zoom level — exactly how zooming a PDF
 * behaves.
 */
export function TextPageRenderer({
  source,
  width,
  zoom,
}: PageContentRendererProps<TextSource>) {
  const baseHeight = width * source.pageAspect;

  return (
    <div
      className="rounded-sm shadow-lg shadow-black/40 bg-white overflow-hidden"
      style={{ width: width * zoom, height: baseHeight * zoom }}
    >
      <div
        className="plainly-text-page"
        style={{
          width,
          height: baseHeight,
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {source.page.blocks.map((block, i) =>
          block.type === "heading" ? (
            <h3 key={i} className="plainly-text-heading">
              {block.text}
            </h3>
          ) : (
            <p key={i} className="plainly-text-paragraph">
              {block.text}
            </p>
          )
        )}
      </div>
    </div>
  );
}

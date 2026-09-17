import { splitBold } from "@/lib/text/paginateText";
import type { PageContentRendererProps, PageSource } from "../types";

/** Renders the writer's **highlights** as real bold, via the same parser
 *  the paginator measures with, so drawn text matches measured text. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {splitBold(text).map((span, i) =>
        span.bold ? <strong key={i}>{span.text}</strong> : <span key={i}>{span.text}</span>
      )}
    </>
  );
}

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
        className="grasp-text-page"
        style={{
          width,
          height: baseHeight,
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
        }}
      >
        {source.page.blocks.map((block, i) =>
          block.type === "heading" ? (
            <h3 key={i} className="grasp-text-heading">
              <Inline text={block.text} />
            </h3>
          ) : (
            <p key={i} className="grasp-text-paragraph">
              <Inline text={block.text} />
            </p>
          )
        )}
      </div>
    </div>
  );
}

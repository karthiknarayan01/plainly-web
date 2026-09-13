import type { PageContentRendererProps, PageSource } from "../types";

type TextSource = Extract<PageSource, { kind: "text" }>;

export function TextPageRenderer({
  source,
  width,
}: PageContentRendererProps<TextSource>) {
  return (
    <div
      className="rounded-sm border border-border bg-background-elevated shadow-lg shadow-black/40"
      style={{ width }}
    >
      <div className="plainly-text-page" style={{ width }}>
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

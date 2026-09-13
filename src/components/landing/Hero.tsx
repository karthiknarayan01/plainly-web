import { NumberedSection } from "@/components/ui/NumberedSection";

export function Hero() {
  return (
    <div className="mx-auto max-w-2xl w-full">
      <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
        Plainly
      </p>
      <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Dense documents, read plainly.
      </h1>
      <p className="text-foreground-muted leading-relaxed mb-12">
        Plainly reads PDFs the way Books reads EPUBs — clean pages, smooth
        scrolling, nothing else in the way. Pick a document below, and if
        it&apos;s the kind that&apos;s deliberately hard to get through — an
        earnings release, a filing, a technical manual — ask for a plain
        language rewrite that keeps every idea and every number, just said
        the way a person would say it.
      </p>

      <div className="flex flex-col gap-8">
        <NumberedSection index={1} title="Pick a document">
          Choose any PDF from your device. It opens instantly — nothing is
          uploaded just to read it.
        </NumberedSection>
        <NumberedSection index={2} title="Read, or rewrite">
          Read the original in a paginated, book-like view, or ask for a
          plain-language rewrite first.
        </NumberedSection>
        <NumberedSection index={3} title="Nothing lost">
          A rewrite means the same thing as the original — same claims, same
          numbers, same figures — just easier to follow.
        </NumberedSection>
      </div>
    </div>
  );
}

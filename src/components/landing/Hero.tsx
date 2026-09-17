import { NumberedSection } from "@/components/ui/NumberedSection";

export function Hero() {
  return (
    <div className="mx-auto max-w-2xl w-full">
      <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
        Grasp
      </p>
      <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Hard documents you actually understand.
      </h1>
      <p className="text-foreground-muted leading-relaxed mb-12">
        Grasp rewrites technical books and financial documents — like
        earnings statements — so a reader with no background in the subject
        can follow them. It explains the jargon instead of repeating it, and
        it still says exactly what the original said.
      </p>

      <div className="flex flex-col gap-8">
        <NumberedSection index={1} title="Pick a document">
          Choose a PDF from your device. Nothing is uploaded just to read
          it.
        </NumberedSection>
        <NumberedSection index={2} title="Read it, or have it explained">
          Read the original as-is, or have it rewritten to be understood
          first.
        </NumberedSection>
        <NumberedSection index={3} title="Nothing is lost">
          The rewrite means exactly what the original means — same facts,
          same numbers, nothing invented. It just makes sense now.
        </NumberedSection>
      </div>
    </div>
  );
}

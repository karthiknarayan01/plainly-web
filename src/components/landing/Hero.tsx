import { NumberedSection } from "@/components/ui/NumberedSection";

export function Hero() {
  return (
    <div className="mx-auto max-w-2xl w-full">
      <p className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
        Plainly
      </p>
      <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Hard documents, made easy to read.
      </h1>
      <p className="text-foreground-muted leading-relaxed mb-12">
        Plainly rewrites technical books and financial documents — like
        earnings statements — into plain language. It says the same things
        as the original. It&apos;s just easier to read.
      </p>

      <div className="flex flex-col gap-8">
        <NumberedSection index={1} title="Pick a document">
          Choose a PDF from your device. Nothing is uploaded just to read
          it.
        </NumberedSection>
        <NumberedSection index={2} title="Read it, or simplify it">
          Read the original as-is, or ask for a simpler rewrite first.
        </NumberedSection>
        <NumberedSection index={3} title="Nothing is lost">
          The rewrite means exactly what the original means — same facts,
          same numbers. Just easier to follow.
        </NumberedSection>
      </div>
    </div>
  );
}

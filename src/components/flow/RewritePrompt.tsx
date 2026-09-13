import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RewritePromptProps {
  fileName: string;
  pageCount: number;
  onReadOriginal: () => void;
  onRewrite: () => void;
  onPickAnother: () => void;
}

export function RewritePrompt({
  fileName,
  pageCount,
  onReadOriginal,
  onRewrite,
  onPickAnother,
}: RewritePromptProps) {
  return (
    <div className="mx-auto max-w-2xl w-full">
      <Card className="p-8">
        <p className="font-mono text-xs uppercase tracking-wider text-foreground-muted mb-2">
          Document ready
        </p>
        <h2 className="text-foreground text-lg mb-1 truncate" title={fileName}>
          {fileName}
        </h2>
        <p className="text-foreground-subtle text-sm mb-8">
          {pageCount} page{pageCount === 1 ? "" : "s"}
        </p>

        <p className="text-foreground-muted mb-6">
          Rewrite this into plain, easy-to-read language before you read it?
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" onClick={onRewrite}>
            Rewrite it for me
          </Button>
          <Button variant="secondary" onClick={onReadOriginal}>
            No, read the original
          </Button>
        </div>
      </Card>
      <button
        onClick={onPickAnother}
        className="mt-4 font-mono text-xs text-foreground-subtle hover:text-foreground-muted transition-colors"
      >
        ← Pick a different document
      </button>
    </div>
  );
}

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RewriteErrorStateProps {
  message: string;
  onRetry: () => void;
  onReadOriginal: () => void;
}

export function RewriteErrorState({
  message,
  onRetry,
  onReadOriginal,
}: RewriteErrorStateProps) {
  return (
    <div className="mx-auto max-w-2xl w-full">
      <Card className="p-8">
        <p className="font-mono text-xs uppercase tracking-wider text-red-400 mb-2">
          Rewrite failed
        </p>
        <p className="text-foreground-muted mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
          <Button variant="secondary" onClick={onReadOriginal}>
            Read the original instead
          </Button>
        </div>
      </Card>
    </div>
  );
}

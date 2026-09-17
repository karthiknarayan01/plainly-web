import { Spinner } from "@/components/ui/Spinner";
import type { RewriteProgress } from "@/lib/rewrite/rewriteClient";

export function RewriteLoadingState({
  fileName,
  progress,
}: {
  fileName: string;
  progress?: RewriteProgress | null;
}) {
  // The reader now waits for the whole document before showing anything,
  // which for a few hundred pages is minutes of waiting. A bare spinner
  // for that long is indistinguishable from a hang, so show the real
  // count the server reports.
  // Failed pages still count toward the total shown. The count itself
  // isn't surfaced — but a failure is a page that's finished being
  // attempted, so excluding it would leave the bar short of 100% on a job
  // that has actually ended, looking stuck when nothing is stuck.
  const done = progress ? progress.completed + progress.failed : 0;
  const total = progress?.total ?? 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl w-full flex flex-col items-center text-center py-16">
      <Spinner className="size-6 text-accent mb-6" />
      <p className="text-foreground mb-1">Rewriting your document…</p>
      <p className="text-foreground-subtle text-sm truncate max-w-full mb-6" title={fileName}>
        {fileName}
      </p>

      {total > 0 && (
        <div className="w-full max-w-sm">
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-3 font-mono text-xs text-foreground-muted">
            {done} / {total} pages
          </p>
          <p className="mt-2 text-xs text-foreground-subtle">
            The whole document opens at once when it&rsquo;s ready.
          </p>
        </div>
      )}
    </div>
  );
}

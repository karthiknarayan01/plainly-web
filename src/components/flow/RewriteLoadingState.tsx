import { Spinner } from "@/components/ui/Spinner";

export function RewriteLoadingState({ fileName }: { fileName: string }) {
  return (
    <div className="mx-auto max-w-2xl w-full flex flex-col items-center text-center py-16">
      <Spinner className="size-6 text-accent mb-6" />
      <p className="text-foreground mb-1">Rewriting your document…</p>
      <p className="text-foreground-subtle text-sm truncate max-w-full" title={fileName}>
        {fileName}
      </p>
    </div>
  );
}

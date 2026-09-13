import type { ReactNode } from "react";
import clsx from "clsx";

interface NumberedSectionProps {
  index: number;
  title: string;
  children: ReactNode;
  className?: string;
}

export function NumberedSection({
  index,
  title,
  children,
  className,
}: NumberedSectionProps) {
  return (
    <section className={clsx("flex gap-4 sm:gap-6", className)}>
      <span className="font-mono text-sm text-foreground-subtle pt-1 shrink-0 w-6 sm:w-8">
        {String(index).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <h3 className="font-mono text-xs uppercase tracking-wider text-foreground-muted mb-2">
          {title}
        </h3>
        <div className="text-foreground-muted leading-relaxed">{children}</div>
      </div>
    </section>
  );
}

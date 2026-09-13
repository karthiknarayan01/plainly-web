import type { ReactNode } from "react";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-center py-4">{children}</div>
  );
}

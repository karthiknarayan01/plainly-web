import { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:brightness-110 disabled:brightness-75",
  secondary:
    "bg-background-elevated text-foreground border border-border-strong hover:border-foreground-muted",
  ghost:
    "text-foreground-muted hover:text-foreground",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-surface hover:bg-accent-hover",
  ghost:
    "border border-rule text-muted hover:bg-accent-soft hover:text-ink",
  danger: "text-high hover:bg-danger-soft",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>(function Button({ variant = "primary", className = "", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
});

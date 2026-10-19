import type { ButtonHTMLAttributes } from "react";

const DEFAULT_COLOR = "#B22B35";

interface CtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string;
}

/** Full-width, bold primary call-to-action button. */
export function CtaButton({ color = DEFAULT_COLOR, className = "", style, ...buttonProps }: CtaButtonProps) {
  return (
    <button
      className={`w-full rounded-2xl py-3.5 text-base font-bold text-white disabled:opacity-60 ${className}`}
      style={{ backgroundColor: color, ...style }}
      {...buttonProps}
    />
  );
}

import type { CSSProperties } from "react";

interface LookAroundLinkProps {
  style?: CSSProperties;
  onClick: () => void;
}

export function LookAroundLink({ style, onClick }: LookAroundLinkProps) {
  return (
    <button
      className="text-sm font-semibold text-[#4A463F] underline underline-offset-4"
      style={style}
      onClick={onClick}
    >
      Got another minute? Take a look around
    </button>
  );
}

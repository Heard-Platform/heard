import type { CSSProperties } from "react";

const TOGA_MONKEY_SRC = "/toga-monkey.png";

interface TogaMonkeyProps {
  size: number;
  style: CSSProperties;
}

export function TogaMonkey({ size, style }: TogaMonkeyProps) {
  const backdropSize = size * 0.75;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size * 1.1, ...style }}>
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-[#E8E3D6]"
        style={{ width: backdropSize, height: backdropSize }}
      />
      <img src={TOGA_MONKEY_SRC} alt="" className="relative h-full w-full object-contain" />
    </div>
  );
}

import { useState } from "react";
import _ from "lodash";
import { EASING, transitionOf, useAnimationTrigger } from "./components/flyer/landing/landing-motion";

const PIECE_COUNT = 42;
const COLORS = ["#F2542D", "#1B1A2E", "#2EC4B6", "#F4B63F", "#6E8B3D", "#9B7BEA"];
const LEAF_COLOR = "#6E8B3D";
const FADE_MS = 500;
const FADE_LEAD_MS = 450;

type PieceShape = "leaf" | "circle" | "rect";

interface ConfettiPiece {
  shape: PieceShape;
  color: string;
  width: number;
  height: number;
  leftPercent: number;
  driftPx: number;
  fallPx: number;
  spinDeg: number;
  durationMs: number;
  delayMs: number;
}

export function RaindownConfetti2({ triggerDelayMs }: { triggerDelayMs: number }) {
  const [pieces] = useState(makePieces);
  const isTriggered = useAnimationTrigger(triggerDelayMs);

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute"
          style={{
            top: -20,
            left: `${piece.leftPercent}%`,
            width: piece.width,
            height: piece.height,
            backgroundColor: piece.color,
            borderRadius: piece.shape === "rect" ? 2 : "50%",
            opacity: isTriggered ? 0 : 1,
            transform: isTriggered
              ? `translate(${piece.driftPx}px, ${piece.fallPx}px) rotate(${piece.spinDeg}deg)`
              : "translate(0, 0) rotate(0deg)",
            transition: [
              transitionOf("transform", piece.durationMs, EASING.fall, piece.delayMs),
              transitionOf("opacity", FADE_MS, EASING.ease, piece.delayMs + piece.durationMs - FADE_LEAD_MS),
            ].join(", "),
          }}
        />
      ))}
    </div>
  );
}

function makePieces(): ConfettiPiece[] {
  return _.times(PIECE_COUNT, (i) => {
    const shape = pieceShape(i);
    const width = shape === "leaf" ? 14 : _.random(6, 11);
    const height = shape === "leaf" ? 7 : shape === "circle" ? width : _.random(9, 16);

    return {
      shape,
      color: shape === "leaf" ? LEAF_COLOR : COLORS[i % COLORS.length],
      width,
      height,
      leftPercent: _.random(0, 100, true),
      driftPx: _.random(-60, 60),
      fallPx: _.random(380, 680),
      spinDeg: _.random(-450, 450),
      durationMs: _.random(1600, 2800),
      delayMs: _.random(0, 500),
    };
  });
}

function pieceShape(index: number): PieceShape {
  if (index % 5 === 0) return "leaf";
  if (index % 3 === 0) return "circle";
  return "rect";
}

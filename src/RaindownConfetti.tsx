import { useState } from "react";
import _ from "lodash";
import { motion } from "motion/react";

const PIECE_COUNT = 40;
const COLORS = ["#a78bfa", "#2dd4bf", "#fbbf24", "#E4603C", "#1c1a2b"];

interface ConfettiPiece {
  left: number;
  drift: number;
  fall: number;
  rotate: number;
  delay: number;
  color: string;
  width: number;
}

function makePieces(): ConfettiPiece[] {
  return _.times(PIECE_COUNT, (i) => ({
    left: _.random(0, 100),
    drift: _.random(-40, 40),
    fall: _.random(280, 520),
    rotate: _.random(-360, 360),
    delay: _.random(0, 0.3, true),
    color: COLORS[i % COLORS.length],
    width: _.random(6, 10),
  }));
}

export function RaindownConfetti() {
  const [pieces] = useState(makePieces);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50 h-0">
      {pieces.map((piece, i) => (
        <motion.span
          key={i}
          className="absolute rounded-sm"
          style={{ left: `${piece.left}%`, width: piece.width, height: piece.width * 0.5, backgroundColor: piece.color }}
          initial={{ y: 60, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: piece.fall, x: piece.drift, rotate: piece.rotate, opacity: 0 }}
          transition={{ duration: 1.8, delay: piece.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

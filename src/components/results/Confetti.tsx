import { motion } from "motion/react";

export function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
          style={{
            background: [
              "#FF6B6B",
              "#4ECDC4",
              "#45B7D1",
              "#FFA07A",
              "#98D8C8",
              "#F7DC6F",
              "#BB8FCE",
              "#85C1E9",
            ][Math.floor(Math.random() * 8)],
            left: `${Math.random() * 100}%`,
            top: "-5%",
          }}
          animate={{
            y: ["0vh", "100vh"],
            x: [0, (Math.random() - 0.5) * 200],
            rotate: [0, Math.random() * 360],
            opacity: [1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            ease: "easeOut",
            delay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}

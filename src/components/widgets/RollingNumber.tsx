import { AnimatePresence, motion } from "motion/react";

function RollingDigit({ digit }: { digit: string }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.6em] translate-y-[2.4px] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function RollingNumber({ value }: { value: number }) {
  const reversedChars = value.toLocaleString().split("").reverse();

  return (
    <span className="inline-flex flex-row-reverse">
      {reversedChars.map((char, i) =>
        /\d/.test(char) ? (
          <RollingDigit key={i} digit={char} />
        ) : (
          <span key={i}>{char}</span>
        ),
      )}
    </span>
  );
}

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { RenderedStatement } from "./RenderedStatement";

interface VoteSwingOverlayProps {
  isOpen: boolean;
  statementText?: string;
  beforeAgreePercent: number;
  afterAgreePercent: number;
  onClose: () => void;
}

type Side = "agree" | "disagree";

const CONFETTI_COLORS = ["#22c55e", "#f43f5e", "#f59e0b", "#3b82f6", "#a855f7"];

function TugBar({
  side,
  fromPercentage,
  toPercentage,
  onAnimationComplete,
}: {
  side: Side;
  fromPercentage: number;
  toPercentage: number;
  onAnimationComplete?: () => void;
}) {
  const isAgree = side === "agree";
  return (
    <motion.div
      className={
        isAgree
          ? "absolute left-0 top-0 h-full bg-gradient-to-r agree-gradient-from agree-gradient-to"
          : "absolute right-0 top-0 h-full bg-gradient-to-l disagree-gradient-from disagree-gradient-to"
      }
      initial={{ width: `${fromPercentage}%` }}
      animate={{ width: `${toPercentage}%` }}
      transition={{ duration: 1.1, delay: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
      onAnimationComplete={onAnimationComplete}
    />
  );
}

function ConfettiBurst() {
  const particles = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const distance = 90 + Math.random() * 60;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export function VoteSwingOverlay({
  isOpen,
  statementText,
  beforeAgreePercent,
  afterAgreePercent,
  onClose,
}: VoteSwingOverlayProps) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettled(false);
    }
  }, [isOpen]);

  const previousMajority: Side = beforeAgreePercent >= 50 ? "agree" : "disagree";
  const newMajority: Side = afterAgreePercent >= 50 ? "agree" : "disagree";

  const displayAgreePercent = Math.round(
    settled ? afterAgreePercent : beforeAgreePercent,
  );
  const displayDisagreePercent = 100 - displayAgreePercent;
  const currentLeader: Side = settled ? newMajority : previousMajority;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-white dark-neutral-gradient"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {settled && <ConfettiBurst />}

            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <motion.div
                initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 180, scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6, type: "spring" }}
                className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
              >
                <RefreshCw className="w-7 h-7" />
              </motion.div>

              <motion.h1
                className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                You Swung the Vote!
              </motion.h1>

              <motion.p
                className="text-sm sm:text-base text-white/90 italic max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                One person really can make a difference sometimes.
              </motion.p>

              {statementText && (
                <motion.p
                  className="text-xs sm:text-sm bg-white/15 rounded-xl px-4 py-2 max-w-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  “<RenderedStatement text={statementText} />”
                </motion.p>
              )}

              <motion.div
                className="w-full mt-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-1.5">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {displayAgreePercent}%
                  </span>
                  <span className="flex items-center gap-1">
                    {displayDisagreePercent}%
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="relative h-5 sm:h-6 bg-white/20 rounded-full overflow-hidden">
                  <TugBar
                    side="agree"
                    fromPercentage={beforeAgreePercent}
                    toPercentage={afterAgreePercent}
                    onAnimationComplete={() => setSettled(true)}
                  />
                  <TugBar
                    side="disagree"
                    fromPercentage={100 - beforeAgreePercent}
                    toPercentage={100 - afterAgreePercent}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-white/60 -translate-x-1/2 z-10" />
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentLeader}
                    className="text-xs sm:text-sm font-semibold mt-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                  >
                    {settled
                      ? currentLeader === "agree"
                        ? "✅ Agree now leads"
                        : "❌ Disagree now leads"
                      : currentLeader === "agree"
                        ? "Agree was leading…"
                        : "Disagree was leading…"}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: settled ? 1 : 0 }}
                className="mt-2"
              >
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={!settled}
                >
                  Continue
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

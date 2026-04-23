import { useEffect } from "react";
import { motion } from "motion/react";
import { PartyPopper } from "lucide-react";

interface CertifyCelebrationStepProps {
  onDone: () => void;
}

export function CertifyCelebrationStep({ onDone }: CertifyCelebrationStepProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      key="celebration"
      className="min-h-[120px] flex flex-col items-center justify-center space-y-4 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
      >
        <PartyPopper className="w-14 h-14 creation-text" />
      </motion.div>
      <div>
        <h3 className="text-2xl font-semibold">You're officially part of Heard! 🎊</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome — check your inbox for a note from us.
        </p>
      </div>
    </motion.div>
  );
}

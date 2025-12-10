import { motion } from "motion/react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { DebateAnalysisReportDemo } from "./DebateAnalysisReportDemo";

interface DebateAnalysisViewDemoProps {
  roomId: string;
  onClose: () => void;
  debateTopic?: string;
}

export function DebateAnalysisViewDemo({
  roomId,
  onClose,
  debateTopic = "Community Development Priorities",
}: DebateAnalysisViewDemoProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-lg"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="h-full overflow-y-auto">
          <DebateAnalysisReportDemo
            debateId={roomId}
            debateTopic={debateTopic}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
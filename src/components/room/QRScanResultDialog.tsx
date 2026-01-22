import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, X, Bell } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { DebateRoom } from "../../types";
import { VoteType } from "../../types";

export type QRScanResult = {
  room: DebateRoom;
  agreePercent: number;
  disagreePercent: number;
  passPercent: number;
  userVote: VoteType;
};

interface QRScanResultDialogProps extends QRScanResult {
  isOpen: boolean;
  onFollowConversation: () => void;
  onJoinDiscussion: () => void;
  onClose: () => void;
}

export function QRScanResultDialog({
  room,
  agreePercent,
  disagreePercent,
  passPercent,
  userVote,
  isOpen,
  onFollowConversation,
  onJoinDiscussion,
  onClose,
}: QRScanResultDialogProps) {
  const [showBars, setShowBars] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShowBars(true), 300);
    } else {
      setShowBars(false);
    }
  }, [isOpen]);

  const voteLabel = userVote === "agree" ? "Agree" : userVote === "disagree" ? "Disagree" : "Unsure";

  const bars = [
    {
      label: "Agree",
      percent: agreePercent,
      color: "bg-green-500",
      glowColor: "shadow-green-500/50",
      isUserVote: userVote === "agree",
    },
    {
      label: "Disagree",
      percent: disagreePercent,
      color: "bg-red-500",
      glowColor: "shadow-red-500/50",
      isUserVote: userVote === "disagree",
    },
    {
      label: "Unsure",
      percent: passPercent,
      color: "bg-yellow-500",
      glowColor: "shadow-yellow-500/50",
      isUserVote: userVote === "pass",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Vote Results</DialogTitle>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-1 rounded-3xl shadow-2xl"
        >
          <div className="bg-slate-900 rounded-3xl p-6 space-y-6">
            <button
              onClick={onClose}
              className="absolute top-7 right-7 rounded-full opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900 p-1"
            >
              <X className="w-4 h-4 text-white" />
              <span className="sr-only">Close</span>
            </button>
            
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-block"
              >
                <div className="w-12 h-12 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-white leading-tight"
              >
                {room.topic}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-300"
              >
                You voted {voteLabel}! 🎉
              </motion.p>
            </div>

            <div className="space-y-4">
              {bars.map((bar, index) => (
                <div key={bar.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-200">
                        {bar.label}
                      </span>
                      {bar.isUserVote && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 1.2 + index * 0.1,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full"
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          <span className="text-xs text-white font-bold">
                            Your vote
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white">
                      {bar.percent}%
                    </span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                    {bar.isUserVote && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0] }}
                        transition={{
                          delay: 1.1 + index * 0.1,
                          duration: 1,
                          repeat: Infinity,
                          repeatDelay: 0.5,
                        }}
                        className={`absolute inset-0 ${bar.color} blur-sm`}
                      />
                    )}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: showBars ? `${bar.percent}%` : 0,
                      }}
                      transition={{
                        delay: 0.3 + index * 0.1,
                        duration: 0.8,
                        ease: "easeOut",
                      }}
                      className={`h-full ${bar.color} relative ${
                        bar.isUserVote ? `shadow-lg ${bar.glowColor}` : ""
                      }`}
                    >
                      {bar.isUserVote && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{
                            delay: 1.1 + index * 0.1,
                            duration: 1.5,
                            repeat: 2,
                          }}
                          className="absolute inset-0 bg-white/30"
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="space-y-3"
            >
              <Button
                onClick={onFollowConversation}
                className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Bell className="w-5 h-5" />
                Follow Conversation
              </Button>

              <button
                onClick={onJoinDiscussion}
                className="w-full text-sm text-slate-300 hover:text-white transition-colors underline"
              >
                Vote on other posts in this discussion
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="flex items-center justify-center gap-2 pt-2 border-t border-slate-800"
            >
              <span className="text-sm font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Heard
              </span>
              <span className="text-xs text-slate-500">
                Beta • Public discourse made fun
              </span>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
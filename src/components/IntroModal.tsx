import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ArrowDown, HandIcon as Swipe, Sparkles } from "lucide-react";

interface IntroModalProps {
  onClose?: () => void;
}

const INTRO_SEEN_KEY = "heard_intro_seen";

export function IntroModal({ onClose }: IntroModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the intro before
    const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
    if (!hasSeenIntro) {
      // Small delay before showing to let the page load
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(INTRO_SEEN_KEY, "true");
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-300">
        <DialogHeader>
          <DialogTitle className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <span className="text-4xl">👋</span>
              <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Welcome to Heard
              </span>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* What is Heard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-white/80 rounded-lg border-2 border-purple-200"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-500 mt-1 shrink-0" />
              <div>
                <h3 className="font-medium text-purple-900 mb-1">
                  What's Heard?
                </h3>
                <p className="text-sm text-muted-foreground">
                  A debate app that makes arguing fun! Share your hot takes,
                  vote on others, and discover where you agree, how you differ,
                  and what quieter ideas are getting missed.
                </p>
              </div>
            </div>
          </motion.div>

          {/* How to use */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-center text-muted-foreground">
              How to Play
            </h3>

            {/* Scroll instruction */}
            <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border-2 border-blue-200">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <ArrowDown className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Scroll Vertically</p>
                <p className="text-xs text-muted-foreground">
                  Browse through different debates
                </p>
              </div>
            </div>

            {/* Swipe instruction */}
            <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border-2 border-orange-200">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                <Swipe className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Swipe to Vote</p>
                <p className="text-xs text-muted-foreground">
                  On any debate, swipe on statements
                </p>
              </div>
            </div>

            {/* Communities instruction */}
            <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg border-2 border-purple-200">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg">🏠</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Browse Communities</p>
                <p className="text-xs text-muted-foreground">
                  Check out different sub-HEARD topics
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleClose}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              Let's Go! 🚀
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

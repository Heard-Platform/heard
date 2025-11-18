import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Sparkles } from "lucide-react";
import { getPastelColor } from "../utils/colors";
import { SwipeIndicatorCompact } from "./SwipeIndicators";
import { SwipeInstructions } from "./SwipeInstructions";

interface IntroModalProps {
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const INTRO_SEEN_KEY = "heard_intro_seen";

// Demo statement cards
const DEMO_STATEMENTS = [
  {
    id: "demo-1",
    text: "Pineapple absolutely belongs on pizza! 🍕🍍",
  },
  {
    id: "demo-2",
    text: "Dogs are better than cats. Fight me! 🐕",
  },
  {
    id: "demo-3",
    text: "Coffee is overrated, tea is superior ☕",
  },
];

function DemoSwipeCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right">("left");

  // Trigger animation after modal loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 1125); // Reduced from 1500 (25% faster)
    return () => clearTimeout(timer);
  }, []);

  // Move to next card after swipe animation
  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % DEMO_STATEMENTS.length);
        setShouldAnimate(false);
        
        // Alternate swipe direction
        setSwipeDirection((prev) => prev === "left" ? "right" : "left");
        
        // Start the cycle again
        const restartTimer = setTimeout(() => {
          setShouldAnimate(true);
        }, 1500); // Reduced from 2000 (25% faster)
        
        return () => clearTimeout(restartTimer);
      }, 750); // Reduced from 1000 (25% faster)
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, currentIndex]);

  const currentStatement = DEMO_STATEMENTS[currentIndex];
  const nextStatement = DEMO_STATEMENTS[(currentIndex + 1) % DEMO_STATEMENTS.length];

  return (
    <div className="relative w-full h-[180px] pb-12">
      {/* Background card */}
      <motion.div
        key={`bg-${nextStatement.id}`}
        className={`absolute top-0 left-0 w-full p-4 rounded-xl border-2 shadow-lg ${getPastelColor(nextStatement.id)}`}
        style={{
          scale: 0.95,
          y: 5,
        }}
      >
        <div className="flex items-center justify-center min-h-[140px]">
          <p className="text-sm text-center leading-relaxed">
            {nextStatement.text}
          </p>
        </div>
      </motion.div>

      {/* Top card with animation */}
      <motion.div
        key={`top-${currentStatement.id}`}
        className={`absolute top-0 left-0 w-full p-4 rounded-xl border-2 shadow-xl ${getPastelColor(currentStatement.id)}`}
        animate={shouldAnimate ? { 
          x: swipeDirection === "left" ? -400 : 400, 
          rotate: swipeDirection === "left" ? -25 : 25, 
          opacity: 0 
        } : { x: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-center min-h-[140px]">
          <p className="text-sm text-center leading-relaxed">
            {currentStatement.text}
          </p>
        </div>

        {/* Disagree indicator (swipe left) */}
        {swipeDirection === "left" && (
          <SwipeIndicatorCompact 
            direction="disagree"
            opacity={shouldAnimate ? 1 : 0}
          />
        )}

        {/* Agree indicator (swipe right) */}
        {swipeDirection === "right" && (
          <SwipeIndicatorCompact 
            direction="agree"
            opacity={shouldAnimate ? 1 : 0}
          />
        )}
      </motion.div>

      {/* Instructions */}
      <div className="absolute -bottom-2 left-0 right-0 space-y-1">
        <SwipeInstructions />
        <div className="text-center text-xs text-muted-foreground">
          Scroll up and down to switch debates
        </div>
      </div>
    </div>
  );
}

export function IntroModal({ onClose, open: controlledOpen, onOpenChange }: IntroModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // If controlled externally, use that, otherwise use internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  useEffect(() => {
    // Only auto-show if not controlled externally
    if (controlledOpen === undefined) {
      // Check if user has seen the intro before
      const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
      if (!hasSeenIntro) {
        // Small delay before showing to let the page load
        const timer = setTimeout(() => setInternalOpen(true), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [controlledOpen]);

  const handleClose = () => {
    localStorage.setItem(INTRO_SEEN_KEY, "true");
    
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
    
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              className="space-y-2"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl">👋</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Welcome to Heard
                </span>
              </div>
              <p className="text-sm text-muted-foreground font-normal max-w-sm mx-auto">
                Heard is a debate app that makes arguing fun! Share your hot takes,
                vote on others, and discover where you agree, how you differ,
                and what quieter ideas are getting missed.
              </p>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* How to Play - Visual Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-medium text-center text-muted-foreground">
              How to Play
            </h3>

            {/* Demo Swipe Card */}
            <div className="p-4 bg-white/80 rounded-lg border-2 border-purple-200">
              <DemoSwipeCard />
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
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
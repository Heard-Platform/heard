import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { MessageCircle, Zap, Heart, Users } from "lucide-react";
import { getPastelColor } from "../utils/colors";
import { SwipeIndicatorCompact } from "./SwipeIndicators";
import { SwipeInstructions } from "./SwipeInstructions";
import { useDarkMode } from "../contexts/DarkModeContext";

interface IntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEMO_TOPIC = "What are the best pizza toppings? 🍕";

const DEMO_STATEMENTS = [
  {
    id: "demo-1",
    text: "Pineapple belongs on pizza and makes it sweet and savory perfection!",
  },
  {
    id: "demo-2",
    text: "Pepperoni is the only topping you ever really need on a pizza.",
  },
  {
    id: "demo-3",
    text: "White pizza is great if tomatoes give you acid reflux.",
  },
  {
    id: "demo-4",
    text: "Mushrooms are underrated! They'll grow on you.",
  },
];

const animatedIcons = [
  { Icon: MessageCircle, color: "text-yellow-200", delay: 0 },
  { Icon: Zap, color: "text-pink-200", delay: 0.3 },
  { Icon: Heart, color: "text-red-200", delay: 0.6 },
  { Icon: Users, color: "text-blue-200", delay: 0.9 },
];

function DemoSwipeCard() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<
    "left" | "right"
  >("left");
  const { isDarkMode } = useDarkMode();

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
        setCurrentIndex(
          (prev) => (prev + 1) % DEMO_STATEMENTS.length,
        );
        setShouldAnimate(false);

        // Alternate swipe direction
        setSwipeDirection((prev) =>
          prev === "left" ? "right" : "left",
        );

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
  const nextStatement =
    DEMO_STATEMENTS[
      (currentIndex + 1) % DEMO_STATEMENTS.length
    ];

  return (
    <div className="relative w-full h-[180px] pb-12">
      {/* Background card */}
      <motion.div
        key={`bg-${nextStatement.id}`}
        className={`absolute top-0 left-0 w-full p-4 rounded-xl border-2 shadow-lg ${getPastelColor(nextStatement.id, isDarkMode)}`}
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
        className={`absolute top-0 left-0 w-full p-4 rounded-xl border-2 shadow-xl ${getPastelColor(currentStatement.id, isDarkMode)}`}
        animate={
          shouldAnimate
            ? {
                x: swipeDirection === "left" ? -400 : 400,
                rotate: swipeDirection === "left" ? -25 : 25,
                opacity: 0,
              }
            : { x: 0, rotate: 0, opacity: 1 }
        }
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
      <div className="absolute bottom-4 left-0 right-0 space-y-1">
        <SwipeInstructions />
      </div>
    </div>
  );
}

export function IntroModal({
  isOpen,
  onClose,
}: IntroModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 border-2 border-purple-300 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15)_0%,transparent_50%)]" />
        
        <div className="relative z-10">
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
                  <span className="text-3xl font-bold bg-gradient-to-r from-yellow-200 via-pink-200 to-white bg-clip-text text-transparent drop-shadow-lg">
                    Welcome to Heard
                  </span>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center gap-2 flex-wrap py-2"
                >
                  {animatedIcons.map(({ Icon, color, delay }) => (
                    <motion.div
                      key={delay}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay }}
                    >
                      <Icon className={`w-5 h-5 ${color}`} />
                    </motion.div>
                  ))}
                </motion.div>
                
                <p className="text-base text-white/95 font-medium drop-shadow-md max-w-sm mx-auto leading-relaxed">
                  Heard is an app for making conversations, debates, and decision-making fun.
                </p>
                
                <p className="text-sm text-white/90">
                  <a
                    href="https://amasonlong.notion.site/About-Heard-2cc4ab4bf00380a9b63ce3b83234ae02?pvs=73"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-yellow-200 hover:text-yellow-100 underline decoration-2 decoration-yellow-300/50 underline-offset-4 transition-colors"
                  >
                    Learn more
                  </a>
                </p>
              </motion.div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Learn how to use Heard by swiping on statements
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-medium text-center text-white/90">
                How to Play
              </h3>

              <Card className="heard-card-bg">
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1">
                        Conversation topic
                      </p>
                      <h2 className="font-bold text-foreground text-sm">
                        {DEMO_TOPIC}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      4 responses
                    </span>
                  </div>

                  <DemoSwipeCard />
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-white text-purple-600 hover:bg-white/90 font-bold shadow-lg"
              >
                Let's Go! 🚀
              </Button>
            </motion.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
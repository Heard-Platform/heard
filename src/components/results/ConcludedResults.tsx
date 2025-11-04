import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import type { Statement } from "../../types";
import {
  AwardsCard,
  LeaderboardCard,
  ControversialCard,
  HiddenGemsCard,
  StatsCard,
  ActionsCard,
} from "./cards";

interface ConcludedResultsProps {
  statements: Statement[];
  onDiscuss?: (statementText: string) => void;
  onShare?: () => void;
  onBackToLobby?: () => void;
}

export function ConcludedResults({
  statements,
  onDiscuss,
  onShare,
  onBackToLobby,
}: ConcludedResultsProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [direction, setDirection] = useState(0);
  const totalCards = 6;
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const nextCard = () => {
    if (currentCard < totalCards - 1) {
      setDirection(1);
      setCurrentCard((prev) => prev + 1);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setDirection(-1);
      setCurrentCard((prev) => prev - 1);
    }
  };

  const goToCard = (index: number) => {
    setDirection(index > currentCard ? 1 : -1);
    setCurrentCard(index);
  };

  // Handle touch swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextCard();
    } else if (isRightSwipe) {
      prevCard();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const cardContent = [
    <AwardsCard key="awards" statements={statements} />,
    <LeaderboardCard key="leaderboard" statements={statements} />,
    <ControversialCard
      key="controversial"
      statements={statements}
      onDiscuss={onDiscuss}
    />,
    <HiddenGemsCard
      key="hidden-gems"
      statements={statements}
      onDiscuss={onDiscuss}
    />,
    <StatsCard key="stats" statements={statements} />,
    <ActionsCard
      key="actions"
      statements={statements}
      onDiscuss={onDiscuss}
      onShare={onShare}
      onBackToLobby={onBackToLobby}
    />,
  ];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
    >
      <div
        className="relative min-h-[500px] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-lg border-2 border-purple-200 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Card Container */}
        <div className="relative h-full p-6 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentCard}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {cardContent[currentCard]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Arrows */}
        {currentCard > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={prevCard}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        {currentCard < totalCards - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={nextCard}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow-md"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}

        {/* Progress Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => goToCard(index)}
              className={`transition-all ${
                index === currentCard
                  ? "w-8 h-2 bg-purple-600"
                  : "w-2 h-2 bg-purple-300 hover:bg-purple-400"
              } rounded-full`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        {/* Card Counter */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/80 rounded-full text-xs font-medium text-muted-foreground">
          {currentCard + 1} / {totalCards}
        </div>

        {/* Swipe hint for mobile */}
        {currentCard === 0 && (
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 0, x: -20 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute bottom-16 right-6 text-xs text-muted-foreground flex items-center gap-1"
          >
            Swipe for more <ChevronRight className="w-3 h-3" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

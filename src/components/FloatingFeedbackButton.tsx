import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FeedbackSheet } from "./FeedbackSheet";

interface FloatingFeedbackButtonProps {
  userId?: string;
}

export function FloatingFeedbackButton({ userId }: FloatingFeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const isDraggingRef = useRef(false);

  // Hide label after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowLabel(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    // Only trigger onPress if we didn't drag
    if (!isDraggingRef.current) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <motion.div
        className="fixed bottom-6 left-6 z-30 cursor-grab active:cursor-grabbing"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3,
        }}
        drag
        dragMomentum={false}
        dragElastic={0.1}
        whileDrag={{ scale: 1.1 }}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          // Reset after a brief delay to prevent click from firing
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 100);
        }}
      >
        <motion.button
          onClick={handleClick}
          className="px-6 py-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow relative overflow-hidden"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-600"
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 80,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          <span className="text-white relative z-10 whitespace-nowrap">
            Talk to Alex
          </span>
          
          {/* Sparkle effect */}
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full z-20"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatDelay: 10,
            }}
          />
        </motion.button>

      </motion.div>

      <FeedbackSheet 
        userId={userId} 
        trigger={null}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  );
}
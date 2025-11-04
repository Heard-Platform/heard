import { useRef } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";

interface FloatingCreateButtonProps {
  onPress: () => void;
}

export function FloatingCreateButton({ onPress }: FloatingCreateButtonProps) {
  const isDraggingRef = useRef(false);

  const handleClick = () => {
    // Only trigger onPress if we didn't drag
    if (!isDraggingRef.current) {
      onPress();
    }
  };

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-30 cursor-grab active:cursor-grabbing"
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
        className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Plus className="w-8 h-8 text-white" strokeWidth={3} />
      </motion.button>

      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-green-400 rounded-full -z-10 pointer-events-none"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

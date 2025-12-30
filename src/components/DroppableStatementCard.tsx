import { useState } from "react";
import { useDrop } from "react-dnd";
import { motion, AnimatePresence } from "motion/react";
import type { Statement } from "../types";

interface DroppableStatementCardProps {
  statement: Statement;
  children: React.ReactNode;
  onPandaDropped?: (statementId: string, pandaIndex: number) => void;
  hasPanda?: boolean;
}

export function DroppableStatementCard({
  statement,
  children,
  onPandaDropped,
  hasPanda = false,
}: DroppableStatementCardProps) {
  const [showDropEffect, setShowDropEffect] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "PANDA_STICKER",
    drop: (item: { id: string; index: number }) => {
      if (onPandaDropped) {
        onPandaDropped(statement.id, item.index);
      }
      setShowDropEffect(true);
      setTimeout(() => setShowDropEffect(false), 1000);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const isActive = isOver && canDrop;

  return (
    <div ref={drop as any} className="relative">
      {/* Drop target overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 rounded-lg border-4 border-dashed border-purple-500 bg-purple-100/30 pointer-events-none flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
              className="text-4xl"
            >
              🐼
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop effect animation */}
      <AnimatePresence>
        {showDropEffect && (
          <motion.div
            initial={{ scale: 2, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
          >
            <span className="text-6xl">🐼✨</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panda badge in top right */}
      <AnimatePresence>
        {hasPanda && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute -top-2 -right-2 z-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full p-1.5 shadow-lg border-2 border-white"
          >
            <span className="text-xl">🐼</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The actual statement card */}
      {children}
    </div>
  );
}

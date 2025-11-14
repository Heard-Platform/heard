import { useDrag } from "react-dnd";
import { motion } from "motion/react";

interface PandaStickerProps {
  id: string;
  index: number;
}

export function PandaSticker({ id, index }: PandaStickerProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "PANDA_STICKER",
    item: { id, index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <motion.div
      ref={drag}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: isDragging ? 1.2 : 1, 
        rotate: 0,
        y: isDragging ? -5 : 0 
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.15, rotate: 10 }}
      className="cursor-grab active:cursor-grabbing select-none"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="relative">
        <span className="text-lg sm:text-xl drop-shadow-lg">🐼</span>
        {/* Sparkle effect */}
        <motion.div
          className="absolute -top-0.5 -right-0.5 text-[8px] sm:text-xs"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
          }}
        >
          ✨
        </motion.div>
      </div>
    </motion.div>
  );
}

interface PandaStickerDockProps {
  roomId: string;
}

export function PandaStickerDock({ roomId }: PandaStickerDockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col gap-0.5 sm:gap-1 items-center bg-gradient-to-br from-purple-100/90 to-pink-100/90 backdrop-blur-sm p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-purple-200 shadow-lg"
    >
      <div className="text-[7px] sm:text-[8px] font-bold text-purple-700 uppercase tracking-wide">
        Persuasive
      </div>
      <div className="flex gap-1 sm:gap-1.5">
        <PandaSticker id={`${roomId}-panda-1`} index={1} />
        <PandaSticker id={`${roomId}-panda-2`} index={2} />
        <PandaSticker id={`${roomId}-panda-3`} index={3} />
      </div>
      <div className="text-[6px] sm:text-[7px] text-purple-600 text-center leading-tight">
        Drag
      </div>
    </motion.div>
  );
}
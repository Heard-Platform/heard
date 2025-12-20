import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// @ts-ignore
import monkeyImg from "figma:asset/2d97176b4315ac24d52cbfeff2724e17a34f84ad.png";

interface MonkeyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MonkeyInfoModal({
  isOpen,
  onClose,
}: MonkeyInfoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 pt-8 pb-6 px-6">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="flex justify-center">
                  <motion.img
                    src={monkeyImg}
                    alt="Monkey Friend"
                    className="w-24 h-28 object-contain drop-shadow-2xl"
                    style={{ scaleX: -1 }}
                    animate={{
                      rotate: [-5, 5, -5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h2 className="text-center text-xl text-gray-900">
                  Your Monkey Friend 🐒
                </h2>
                <p className="text-center text-sm text-gray-600 leading-relaxed">
                  We thought everyone could use a monkey friend to
                  help them navigate the twists and turns of
                  healthy and sometimes challenging discourse.
                </p>
                <p className="text-center text-sm text-gray-600 leading-relaxed">
                  You can also see other people's monkeys to see who
                  else is "hanging" around! 🙈
                </p>
                <button
                  onClick={onClose}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-all shadow-md"
                >
                  Got it!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

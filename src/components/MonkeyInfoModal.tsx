import { X } from "lucide-react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";

// @ts-ignore
import monkeyImg from "figma:asset/2d97176b4315ac24d52cbfeff2724e17a34f84ad.png";

interface MonkeyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFeedMonkey: () => void;
}

export function MonkeyInfoModal({
  isOpen,
  onClose,
  onFeedMonkey,
}: MonkeyInfoModalProps) {
  const handleFeedMonkey = () => {
    onClose();
    setTimeout(() => {
      onFeedMonkey();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-md overflow-hidden">
        <DialogTitle className="sr-only">Your Monkey Friend</DialogTitle>
        <DialogDescription className="sr-only">
          Learn about your monkey companion in Heard
        </DialogDescription>
        <div className="relative bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 pt-8 pb-6 px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors z-10"
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
        <div className="p-6 space-y-4 bg-white">
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
          <div className="flex gap-2">
            <button
              onClick={handleFeedMonkey}
              className="flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full hover:from-yellow-500 hover:to-orange-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🍌 Feed Monkey
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-all shadow-md"
            >
              Got it!
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
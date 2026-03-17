import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { AVATAR_OPTIONS, getAvatarImage, AvatarAnimal } from "../../utils/constants/avatars";

const VISIBLE_SLOTS = [-2, -1, 0, 1, 2] as const;

const SLOT_SPACING = 70;

const SLOT_STYLES: Record<number, { scale: number; opacity: number; zIndex: number }> = {
  [-2]: { scale: 0.45, opacity: 0.25, zIndex: 1 },
  [-1]: { scale: 0.65, opacity: 0.5, zIndex: 2 },
  [0]: { scale: 1, opacity: 1, zIndex: 3 },
  [1]: { scale: 0.65, opacity: 0.5, zIndex: 2 },
  [2]: { scale: 0.45, opacity: 0.25, zIndex: 1 },
};

const SPRING_CONFIG = { type: "spring" as const, stiffness: 300, damping: 30 };

interface MonkeyInfoModalProps {
  isOpen: boolean;
  currentAvatar: AvatarAnimal;
  isLoggedIn: boolean;
  onClose: () => void;
  onFeedMonkey: () => void;
  onSelectAvatar: (avatar: AvatarAnimal) => void;
}

export function MonkeyInfoModal({
  isOpen,
  onClose,
  onFeedMonkey,
  currentAvatar,
  onSelectAvatar,
  isLoggedIn,
}: MonkeyInfoModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(() =>
    Math.max(0, AVATAR_OPTIONS.findIndex((o) => o.id === currentAvatar))
  );
  useEffect(() => {
    const idx = AVATAR_OPTIONS.findIndex((o) => o.id === currentAvatar);
    if (idx >= 0) setSelectedIndex(idx);
  }, [currentAvatar]);

  const selectedAvatar = AVATAR_OPTIONS[selectedIndex].id;

  const wrapIndex = useCallback(
    (i: number) => ((i % AVATAR_OPTIONS.length) + AVATAR_OPTIONS.length) % AVATAR_OPTIONS.length,
    []
  );

  const handlePrev = useCallback(() => {
    const newIndex = wrapIndex(selectedIndex - 1);
    setSelectedIndex(newIndex);
    onSelectAvatar(AVATAR_OPTIONS[newIndex].id);
  }, [selectedIndex, wrapIndex, onSelectAvatar]);

  const handleNext = useCallback(() => {
    const newIndex = wrapIndex(selectedIndex + 1);
    setSelectedIndex(newIndex);
    onSelectAvatar(AVATAR_OPTIONS[newIndex].id);
  }, [selectedIndex, wrapIndex, onSelectAvatar]);

  const [screenTimeEnd, setScreenTimeEnd] = useState<number | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(0);

  useEffect(() => {
    const savedEnd = localStorage.getItem("screenTimeEnd");
    if (savedEnd) {
      const endTime = Number(savedEnd);
      if (endTime < Date.now()) {
        localStorage.removeItem("screenTimeEnd");
        setScreenTimeEnd(null);
      } else {
        setScreenTimeEnd(endTime);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!screenTimeEnd) {
      setRemainingMinutes(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((screenTimeEnd - Date.now()) / 1000 / 60));
      setRemainingMinutes(remaining);
      
      if (remaining === 0) {
        setScreenTimeEnd(null);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [screenTimeEnd]);

  const handleSetScreenTime = (minutes: number) => {
    const endTime = Date.now() + (minutes * 60 * 1000);
    localStorage.setItem("screenTimeEnd", String(endTime));
    setScreenTimeEnd(endTime);
  };

  const handleClearScreenTime = () => {
    localStorage.removeItem("screenTimeEnd");
    setScreenTimeEnd(null);
    setRemainingMinutes(0);
  };

  const handleFeedMonkey = () => {
    onClose();
    setTimeout(() => {
      onFeedMonkey();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-0 shadow-2xl max-w-md overflow-y-auto max-h-[90vh]" onPointerDownOutside={(e: Event) => e.preventDefault()}>
        <DialogTitle className="sr-only">Your Animal Friend</DialogTitle>
        <DialogDescription className="sr-only">
          Learn about your animal companion in Heard
        </DialogDescription>
        <div className="relative bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 pt-8 pb-6 px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          {isLoggedIn ? (
            <div className="relative flex items-center justify-center h-32">
              <button
                onClick={handlePrev}
                className="absolute left-0 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {VISIBLE_SLOTS.map((offset) => {
                  const idx = wrapIndex(selectedIndex + offset);
                  const option = AVATAR_OPTIONS[idx];
                  const style = SLOT_STYLES[offset];
                  return (
                    <motion.div
                      key={`slot-${offset}`}
                      className="absolute flex flex-col items-center"
                      animate={{
                        x: offset * SLOT_SPACING,
                        scale: style.scale,
                        opacity: style.opacity,
                        zIndex: style.zIndex,
                      }}
                      transition={SPRING_CONFIG}
                    >
                      <img
                        src={option.img}
                        alt={option.label}
                        className="w-20 h-24 object-contain drop-shadow-2xl"
                        style={{ transform: "scaleX(-1)" }}
                      />
                      {offset === 0 && (
                        <span className="text-xs text-white font-medium mt-1 drop-shadow">
                          {option.label}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              <button
                onClick={handleNext}
                className="absolute right-0 z-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <motion.img
                src={getAvatarImage(selectedAvatar)}
                alt="Your Animal Friend"
                className="w-24 h-28 object-contain drop-shadow-2xl"
                style={{ scaleX: -1 }}
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
        <div className="p-6 space-y-4 bg-white">
          <h2 className="text-center text-xl text-gray-900">
            Your Animal Friend 🐒
          </h2>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            We thought everyone could use an animal friend to
            help them navigate the twists and turns of
            healthy and sometimes challenging discourse.
          </p>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            You can also see other people's animals to see who
            else is "hanging" around! 🙈
          </p>

          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-sm text-gray-700 mb-2">
              Screen Time Warning{" "}
              <span
                onClick={() => {
                  const endTime = Date.now() + 10_000;
                  localStorage.setItem("screenTimeEnd", String(endTime));
                  setScreenTimeEnd(endTime);
                }}
              >
                ⏰
              </span>
            </h3>
            {screenTimeEnd ? (
              <div className="space-y-2">
                <div className="text-center py-2 px-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    {remainingMinutes} min remaining
                  </p>
                </div>
                <button
                  onClick={handleClearScreenTime}
                  className="w-full py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all text-sm"
                >
                  Clear Warning
                </button>
              </div>
            ) : (
              <select
                onChange={(e) => {
                  const value = e.target.value;
                  if (value) {
                    handleSetScreenTime(Number(value));
                  }
                }}
                value=""
                className="w-full py-2 px-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-full hover:bg-blue-100 transition-all text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Set a time limit...</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            )}
          </div>

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
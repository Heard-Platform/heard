import { X } from "lucide-react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { useState, useEffect } from "react";
import { AVATAR_OPTIONS, getAvatarImage, AvatarAnimal } from "../../utils/constants/avatars";

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
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarAnimal>(currentAvatar);
  useEffect(() => { setSelectedAvatar(currentAvatar); }, [currentAvatar]);
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
      <DialogContent className="p-0 border-0 shadow-2xl max-w-md overflow-y-auto max-h-[90vh]" onPointerDownOutside={(e) => e.preventDefault()}>
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
          <div className="flex justify-center">
            <motion.img
              src={getAvatarImage(selectedAvatar)}
              alt="Your Animal Friend"
              className="w-24 h-28 object-contain drop-shadow-2xl cursor-pointer"
              style={{ scaleX: -1 }}
              animate={{
                rotate: [-5, 5, -5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
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
            <h3 className="text-sm text-gray-700 mb-2">Choose Your Avatar</h3>
            {isLoggedIn ? (
              <div className="grid grid-cols-3 gap-2">
                {AVATAR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      setSelectedAvatar(option.id);
                      onSelectAvatar(option.id);
                    }}
                    className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                      selectedAvatar === option.id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <img
                      src={option.img}
                      alt={option.label}
                      className="w-12 h-14 object-contain"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    <span className="text-xs text-gray-600 mt-1">{option.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">
                Log in with your phone or email to choose an avatar
              </p>
            )}
          </div>

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
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AvatarCarousel } from "./AvatarCarousel";
import { AvatarAnimal } from "../../utils/constants/avatars";

interface VineInfoModalProps {
  currentAvatar: AvatarAnimal;
  isOpen: boolean;
  isLoggedIn: boolean;
  onFeed: () => void;
  onClose: () => void;
}

export function VineInfoModal({
  currentAvatar,
  isOpen,
  isLoggedIn,
  onFeed,
  onClose,
}: VineInfoModalProps) {
  const { t } = useTranslation("vine");
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

  const handleFeed = () => {
    onClose();
    setTimeout(() => {
      onFeed();
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="p-0 border-0 shadow-2xl max-w-md overflow-y-auto max-h-[90vh]"
        onPointerDownOutside={(e: Event) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {t("vineFriendTitle")}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {t("vineSrDesc")}
        </DialogDescription>
        <div className="relative bg-gradient-to-br from-green-400 via-emerald-400 to-teal-500 pt-8 pb-6 px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <AvatarCarousel
            isLoggedIn={isLoggedIn}
            currentAvatar={currentAvatar}
          />
        </div>
        <div className="p-6 space-y-4 bg-white">
          <h2 className="text-center text-xl text-gray-900">
            {t("vineFriendHeading")}
          </h2>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            {t("vineInfoP1")}
          </p>
          <p className="text-center text-sm text-gray-600 leading-relaxed">
            {t("vineInfoP2")}
          </p>

          <div className="pt-2 border-t border-gray-200">
            <h3 className="text-sm text-gray-700 mb-2">
              {t("vineScreenTimeWarning")}{" "}
              <span
                onClick={() => {
                  const endTime = Date.now() + 10_000;
                  localStorage.setItem(
                    "screenTimeEnd",
                    String(endTime),
                  );
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
                    {t("vineMinRemaining", { count: remainingMinutes })}
                  </p>
                </div>
                <button
                  onClick={handleClearScreenTime}
                  className="w-full py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-all text-sm"
                >
                  {t("vineClearWarning")}
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
                <option value="">{t("vineSetTimeLimit")}</option>
                <option value="15">{t("vineMinutesOption", { count: 15 })}</option>
                <option value="30">{t("vineMinutesOption", { count: 30 })}</option>
                <option value="60">{t("vineMinutesOption", { count: 60 })}</option>
              </select>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full hover:from-green-500 hover:to-emerald-600 transition-all shadow-md"
            >
              {t("vineGotIt")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
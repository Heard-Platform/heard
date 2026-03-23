import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserPresence, UserSession } from "../../types";
import { MonkeyInfoModal } from "./MonkeyInfoModal";
import { TalkBubble } from "../TalkBubble";
import { ScreenTimeWarningDialog } from "./ScreenTimeWarningDialog";
import { getAvatarImage } from "../../utils/constants/avatars";

// @ts-ignore
import monkeyWithWrench from "figma:asset/ab06931b1dc1dfba1d9cf4a9e389e4b87471b96c.png";

// @ts-ignore
import monkeyEatGif from "figma:asset/416642fb93a66e81fcfc63265a8ca59b7901788e.png";


interface VineNavigatorProps {
  totalCards: number;
  currentIndex: number;
  currentUser: UserSession;
  presences: UserPresence[];
  onUpdatePresence: (
    userId: string,
    currentRoomIndex: number,
  ) => void;
}

const AVATAR_SIZE = 32;
const OTHER_MONKEY_SIZE = 24;
const VINE_WIDTH = 16;

export function VineNavigator({
  totalCards,
  currentIndex,
  currentUser,
  presences,
  onUpdatePresence,
}: VineNavigatorProps) {
  const isLoggedIn = !currentUser.isAnonymous;
  const [monkeyPosition, setMonkeyPosition] =
    useState(currentIndex);
  const [monkeyOffset, setMonkeyOffset] = useState(0);
  const [otherMonkeyOffsets, setOtherMonkeyOffsets] = useState<
    Record<string, number>
  >({});
  const [showMonkeyInfo, setShowMonkeyInfo] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [screenTimeExceeded, setScreenTimeExceeded] = useState(false);
  const [showScreenTimeDialog, setShowScreenTimeDialog] = useState(false);

  const vineHeight = totalCards * window.innerHeight;

  const handleFeedMonkey = () => {
    setIsEating(true);
    setShowSpeechBubble(false);
    setTimeout(() => {
      setShowSpeechBubble(true);
    }, 2000);
    setTimeout(() => {
      setIsEating(false);
    }, 3000);
    setTimeout(() => {
      setShowSpeechBubble(false);
    }, 4000);
  };

  useEffect(() => {
    const checkScreenTime = () => {
      const endTime = localStorage.getItem("screenTimeEnd");
      
      if (endTime) {
        const remaining = Number(endTime) - Date.now();
        
        if (remaining <= 0) {
          setScreenTimeExceeded(true);
          localStorage.removeItem("screenTimeEnd");
        } else {
          setScreenTimeExceeded(false);
        }
      } else {
        setScreenTimeExceeded(false);
      }
    };

    checkScreenTime();
    const interval = setInterval(checkScreenTime, 10000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (screenTimeExceeded) {
      const timer = setTimeout(() => {
        setShowScreenTimeDialog(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [screenTimeExceeded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMonkeyPosition(currentIndex);
      setMonkeyOffset((Math.random() - 0.5) * 300);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    if (!onUpdatePresence) return;

    onUpdatePresence(currentUser.id, currentIndex);

    const presenceInterval = setInterval(() => {
      onUpdatePresence(currentUser.id, currentIndex);
    }, 3000);

    return () => clearInterval(presenceInterval);
  }, [currentUser.id, currentIndex]);

  useEffect(() => {
    const newOffsets: Record<string, number> = {};
    presences.forEach((presence) => {
      const key = `${presence.userId}-${presence.currentRoomIndex}`;
      if (!otherMonkeyOffsets[key]) {
        newOffsets[key] = (Math.random() - 0.5) * 300;
      }
    });

    if (Object.keys(newOffsets).length > 0) {
      setOtherMonkeyOffsets((prev) => ({
        ...prev,
        ...newOffsets,
      }));
    }
  }, [presences]);

  const getAvatarPositionFromIndex = (roomIndex: number) => {
    return (
      roomIndex * window.innerHeight + window.innerHeight / 2
    );
  };

  const getAvatarColor = (userId: string) => {
    const colors = [
      "from-pink-500 to-rose-500",
      "from-purple-500 to-indigo-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-yellow-500 to-orange-500",
      "from-red-500 to-pink-500",
      "from-indigo-500 to-purple-500",
      "from-teal-500 to-green-500",
    ];

    const hash = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getVineXPosition = (y: number) => {
    return VINE_WIDTH / 2 + Math.sin(y / 150) * 4;
  };

  const generateVinePath = () => {
    const segments = Math.ceil(vineHeight / 100);
    let path = `M ${VINE_WIDTH / 2} 0`;

    for (let i = 1; i <= segments; i++) {
      const y = (i / segments) * vineHeight;
      const x = getVineXPosition(y);
      const prevY = ((i - 1) / segments) * vineHeight;
      const controlY = (prevY + y) / 2;
      const controlX = getVineXPosition(controlY);

      path += ` Q ${controlX} ${controlY}, ${x} ${y}`;
    }

    return path;
  };

  const currentUserImg = isEating
    ? monkeyEatGif
    : currentUser.isTestUser
      ? monkeyWithWrench
      : getAvatarImage(currentUser.avatarAnimal);

  return (
    <div
      className="absolute -right-4 top-0 vine-layer pointer-events-none"
      style={{ height: vineHeight }}
    >
      <svg
        width={VINE_WIDTH + 8}
        height={vineHeight}
        className="absolute left-0"
        style={{ zIndex: 0, opacity: 0.7 }}
      >
        <defs>
          <linearGradient
            id="vineGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              style={{ stopColor: "#10b981", stopOpacity: 0.6 }}
            />
            <stop
              offset="50%"
              style={{ stopColor: "#059669", stopOpacity: 0.7 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#047857", stopOpacity: 0.6 }}
            />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3"
              floodOpacity="0.2"
            />
          </filter>
        </defs>

        <path
          d={generateVinePath()}
          stroke="url(#vineGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          filter="url(#shadow)"
        />

        {Array.from({ length: Math.ceil(vineHeight / 40) }).map(
          (_, i) => {
            const y = i * 40 + 20;
            const x = getVineXPosition(y);
            const rotation = Math.sin(y / 40) * 30;
            return (
              <g key={i}>
                <ellipse
                  cx={x}
                  cy={y}
                  rx="4"
                  ry="6"
                  fill="#10b981"
                  opacity="0.6"
                  transform={`rotate(${rotation} ${x} ${y})`}
                />
              </g>
            );
          },
        )}
      </svg>

      <div
        className="relative pointer-events-auto"
        style={{ height: vineHeight, width: AVATAR_SIZE + 20 }}
      >
        <motion.div
          animate={{
            top:
              getAvatarPositionFromIndex(monkeyPosition) +
              monkeyOffset,
          }}
          transition={{
            type: "spring",
            stiffness: 150,
            damping: 20,
            mass: 1.2,
          }}
          className="absolute z-20 pointer-events-auto"
          style={{
            width: 45,
            height: 52.5,
            left: VINE_WIDTH / 2 - 13.5,
            marginTop: -26.25,
          }}
        >
          <motion.img
            src={currentUserImg}
            alt="Monkey Avatar"
            className="w-full h-full object-contain drop-shadow-lg cursor-pointer"
            style={{ scaleX: -1, opacity: 1 }}
            animate={
              isEating
                ? {
                    filter: [
                      "drop-shadow(0 0 20px rgba(255, 183, 0, 1))",
                      "drop-shadow(0 0 30px rgba(255, 183, 0, 1))",
                      "drop-shadow(0 0 20px rgba(255, 183, 0, 1))",
                    ],
                  }
                : {
                    filter: [
                      "drop-shadow(0 0 0px rgba(16, 185, 129, 0))",
                      "drop-shadow(0 0 12px rgba(16, 185, 129, 0.9))",
                      "drop-shadow(0 0 0px rgba(16, 185, 129, 0))",
                    ],
                  }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowMonkeyInfo(true);
            }}
            whileTap={{ scale: 0.95 }}
          />
          {screenTimeExceeded && (
            <TalkBubble
              text="⚠️"
              isVisible={true}
              color="text-yellow-600"
              borderColor="border-yellow-400"
              position="top"
            />
          )}
          <TalkBubble
            text="Yum!"
            isVisible={showSpeechBubble}
            color="text-amber-600"
            borderColor="border-amber-200"
            position="top"
          />
        </motion.div>

        <AnimatePresence>
          {presences.map((presence) => {
            const key = `${presence.userId}-${presence.currentRoomIndex}`;
            const offset = otherMonkeyOffsets[key] || 0;
            const top =
              getAvatarPositionFromIndex(presence.currentRoomIndex) +
              offset;
            const isOnSameConvo =
              presence.currentRoomIndex === currentIndex;

            const monkeyWidth = OTHER_MONKEY_SIZE * 0.857;
            const monkeyHeight = OTHER_MONKEY_SIZE;

            return (
              <motion.div
                key={presence.userId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 0.8,
                  scale: isOnSameConvo ? 1.2 : 1,
                  top,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  damping: 50,
                }}
                className="absolute"
                style={{
                  width: monkeyWidth,
                  height: monkeyHeight,
                  left: 4,
                  marginTop: -monkeyHeight / 2,
                }}
              >
                <div className="relative">
                  <motion.img
                    src={getAvatarImage(presence.avatarAnimal)}
                    alt={`${presence.userId} avatar`}
                    className="w-full h-full object-contain drop-shadow-lg cursor-pointer"
                    style={{ scaleX: -1 }}
                  />

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {showMonkeyInfo && (
        <MonkeyInfoModal
          isOpen={showMonkeyInfo}
          currentAvatar={currentUser.avatarAnimal ?? "monkey"}
          isLoggedIn={isLoggedIn}
          onClose={() => setShowMonkeyInfo(false)}
          onFeedMonkey={handleFeedMonkey}
        />
      )}

      {showScreenTimeDialog && (
        <ScreenTimeWarningDialog
          isOpen={showScreenTimeDialog}
          onClose={() => {
            setShowScreenTimeDialog(false);
            setScreenTimeExceeded(false);
          }}
        />
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../utils/api";
import monkeyImg from "figma:asset/2d97176b4315ac24d52cbfeff2724e17a34f84ad.png";

interface UserPresence {
  userId: string;
  currentRoomIndex: number;
  lastUpdated: number;
}

interface VineNavigatorProps {
  totalCards: number;
  currentIndex: number;
  currentUserId?: string;
}

const AVATAR_SIZE = 32;
const VINE_WIDTH = 16;

export function VineNavigator({
  totalCards,
  currentIndex,
  currentUserId,
}: VineNavigatorProps) {
  const [presences, setPresences] = useState<UserPresence[]>(
    [],
  );
  const [monkeyPosition, setMonkeyPosition] =
    useState(currentIndex);
  const [monkeyOffset, setMonkeyOffset] = useState(0);

  const vineHeight = totalCards * window.innerHeight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setMonkeyPosition(currentIndex);
      setMonkeyOffset((Math.random() - 0.5) * 300);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  useEffect(() => {
    if (!currentUserId) return;

    const updatePresence = async () => {
      await api.updateUserPresence(
        currentUserId,
        currentIndex,
      );
    };

    updatePresence();

    const presenceInterval = setInterval(updatePresence, 3000);

    return () => clearInterval(presenceInterval);
  }, [currentUserId, currentIndex]);

  useEffect(() => {
    const fetchPresences = async () => {
      const response = await api.getActivePresences();
      if (response.success && response.data) {
        const presenceData =
          response.data.data || response.data;
        if (Array.isArray(presenceData)) {
          setPresences(
            presenceData.filter(
              (p: UserPresence) => p.userId !== currentUserId,
            ),
          );
        }
      }
    };

    fetchPresences();
    const pollInterval = setInterval(fetchPresences, 2000);

    return () => clearInterval(pollInterval);
  }, [currentUserId]);

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

  return (
    <div
      className="absolute right-0 top-0 z-10 pointer-events-none"
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
        {currentUserId && (
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
            className="absolute z-20"
            style={{
              width: 45,
              height: 52.5,
              left: VINE_WIDTH / 2 - 13.5,
              marginTop: -26.25,
            }}
          >
            <motion.img
              src={monkeyImg}
              alt="Monkey Avatar"
              className="w-full h-full object-contain drop-shadow-lg"
              style={{ scaleX: -1, opacity: 1 }}
              animate={
                monkeyPosition !== currentIndex
                  ? {
                      rotate: [0, -5, 5, -5, 5, 0],
                      scale: [1, 1.05, 1],
                    }
                  : {
                      rotate: [0, -2, 2, -2, 0],
                    }
              }
              transition={
                monkeyPosition !== currentIndex
                  ? {
                      duration: 0.5,
                      repeat: Infinity,
                      repeatDelay: 0.3,
                    }
                  : {
                      duration: 2,
                      repeat: Infinity,
                    }
              }
            />
          </motion.div>
        )}

        <AnimatePresence>
          {presences.map((presence) => {
            const top = getAvatarPositionFromIndex(
              presence.currentRoomIndex,
            );
            const isOnSameConvo =
              presence.currentRoomIndex === currentIndex;

            return (
              <motion.div
                key={presence.userId}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: isOnSameConvo ? 1.2 : 1,
                  top,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 25,
                }}
                className="absolute"
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  left: VINE_WIDTH / 2 - AVATAR_SIZE / 2,
                }}
              >
                <div className="relative group">
                  <motion.div
                    className={`w-full h-full rounded-full bg-gradient-to-br ${getAvatarColor(presence.userId)} shadow-lg flex items-center justify-center cursor-pointer border-2 border-white`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={
                      isOnSameConvo
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(16, 185, 129, 0)",
                              "0 0 0 8px rgba(16, 185, 129, 0.3)",
                              "0 0 0 0 rgba(16, 185, 129, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={
                      isOnSameConvo
                        ? {
                            duration: 2,
                            repeat: Infinity,
                          }
                        : {}
                    }
                  >
                    <span className="text-white text-xs font-bold">
                      {presence.userId
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </motion.div>

                  <div className="absolute -right-2 top-1/2 transform translate-x-full -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                      {presence.userId}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
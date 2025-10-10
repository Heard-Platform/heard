import { motion } from "motion/react";
import { useState } from "react";
import {
  Users,
  Flame,
  Handshake,
  Radio,
} from "lucide-react";

interface DebateMetricsButtonProps {
  participation?: number; // 0-100
  spiciness?: number; // 0-100
  agreement?: number; // 0-100
  minorityBuyIn?: number; // 0-100
}

export function DebateMetricsButton({
  participation = 0,
  spiciness = 0,
  agreement = 0,
  minorityBuyIn = 0,
}: DebateMetricsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const metrics = [
    {
      name: "Participation",
      value: participation,
      icon: Users,
      color: "#8B7355", // wood tone
      description: "How many people are engaged",
    },
    {
      name: "Spiciness",
      value: spiciness,
      icon: Flame,
      color: "#8B7355", // wood tone
      description: "Is there a diversity of opinions?",
    },
    {
      name: "Agreement",
      value: agreement,
      icon: Handshake,
      color: "#8B7355", // wood tone
      description: "How much different groups agree",
    },
    {
      name: "Smaller Voices",
      value: minorityBuyIn,
      icon: Radio,
      color: "#8B7355", // wood tone
      description: "Are all voices being heard?",
    },
  ];

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Calculate puzzle piece positions based on metric values
  // 0% = pieces are far from center, 100% = pieces lock into center
  const getPieceOffset = (value: number) => {
    // Start at 12px away, move to 0px at 100%
    return 12 - (value / 100) * 12;
  };

  const puzzleColor = "#D4B896"; // Wooden/beige color for all pieces

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div className="relative scale-75">
        {/* Jigsaw puzzle circle - tap to toggle */}
        <button
          onClick={handleToggle}
          className="relative w-24 h-24 cursor-pointer active:scale-95 transition-transform"
        >
          {/* Background circle with shadow */}
          <div className="absolute inset-0 rounded-full shadow-lg" style={{ backgroundColor: '#F0EAE0' }} />
          
          {/* Guide circle - shows where puzzle pieces will meet */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            {/* Circle outline */}
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="#B0B0B0"
              strokeWidth="1.5"
              strokeDasharray="3,2"
              opacity="0.8"
            />
            {/* Vertical divider line */}
            <line
              x1="50"
              y1="20"
              x2="50"
              y2="80"
              stroke="#B0B0B0"
              strokeWidth="1.5"
              strokeDasharray="3,2"
              opacity="0.8"
            />
            {/* Horizontal divider line */}
            <line
              x1="20"
              y1="50"
              x2="80"
              y2="50"
              stroke="#B0B0B0"
              strokeWidth="1.5"
              strokeDasharray="3,2"
              opacity="0.8"
            />
          </svg>
          
          {/* Center sparkle that appears when all complete */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: metrics.every(m => m.value === 100) ? 1 : 0,
              scale: metrics.every(m => m.value === 100) ? 1 : 0,
              rotate: metrics.every(m => m.value === 100) ? 360 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
          >
            <div className="text-2xl">✨</div>
          </motion.div>

          {/* SVG Puzzle Pieces with icons */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100">
            <defs>
              {/* Shadow filter */}
              <filter id="pieceShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.15"/>
              </filter>
            </defs>

            {/* Top-left quadrant (Participation) */}
            <motion.g
              animate={{
                x: -getPieceOffset(metrics[0].value),
                y: -getPieceOffset(metrics[0].value),
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0,
              }}
            >
              <path
                d="M 50 50 L 20 50 A 30 30 0 0 1 50 20 Z"
                fill={puzzleColor}
                stroke="#8B7355"
                strokeWidth="1.5"
                strokeLinejoin="round"
                filter="url(#pieceShadow)"
              />
              <foreignObject x="30" y="30" width="16" height="16">
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const Icon = metrics[0].icon;
                    return <Icon className="w-4 h-4" style={{ color: "#8B7355" }} strokeWidth={2} />;
                  })()}
                </div>
              </foreignObject>
            </motion.g>

            {/* Top-right quadrant (Spiciness) */}
            <motion.g
              animate={{
                x: getPieceOffset(metrics[1].value),
                y: -getPieceOffset(metrics[1].value),
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.05,
              }}
            >
              <path
                d="M 50 50 L 80 50 A 30 30 0 0 0 50 20 Z"
                fill={puzzleColor}
                stroke="#8B7355"
                strokeWidth="1.5"
                strokeLinejoin="round"
                filter="url(#pieceShadow)"
              />
              <foreignObject x="54" y="30" width="16" height="16">
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const Icon = metrics[1].icon;
                    return <Icon className="w-4 h-4" style={{ color: "#8B7355" }} strokeWidth={2} />;
                  })()}
                </div>
              </foreignObject>
            </motion.g>

            {/* Bottom-right quadrant (Agreement) */}
            <motion.g
              animate={{
                x: getPieceOffset(metrics[2].value),
                y: getPieceOffset(metrics[2].value),
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.1,
              }}
            >
              <path
                d="M 50 50 L 80 50 A 30 30 0 0 1 50 80 Z"
                fill={puzzleColor}
                stroke="#8B7355"
                strokeWidth="1.5"
                strokeLinejoin="round"
                filter="url(#pieceShadow)"
              />
              <foreignObject x="54" y="54" width="16" height="16">
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const Icon = metrics[2].icon;
                    return <Icon className="w-4 h-4" style={{ color: "#8B7355" }} strokeWidth={2} />;
                  })()}
                </div>
              </foreignObject>
            </motion.g>

            {/* Bottom-left quadrant (Minority Buy-in) */}
            <motion.g
              animate={{
                x: -getPieceOffset(metrics[3].value),
                y: getPieceOffset(metrics[3].value),
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                delay: 0.15,
              }}
            >
              <path
                d="M 50 50 L 20 50 A 30 30 0 0 0 50 80 Z"
                fill={puzzleColor}
                stroke="#8B7355"
                strokeWidth="1.5"
                strokeLinejoin="round"
                filter="url(#pieceShadow)"
              />
              <foreignObject x="30" y="54" width="16" height="16">
                <div className="w-full h-full flex items-center justify-center">
                  {(() => {
                    const Icon = metrics[3].icon;
                    return <Icon className="w-4 h-4" style={{ color: "#8B7355" }} strokeWidth={2} />;
                  })()}
                </div>
              </foreignObject>
            </motion.g>
          </svg>
        </button>

        {/* Tooltip on tap */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isOpen ? 1 : 0,
            y: isOpen ? 0 : 10,
          }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-full right-0 mb-2 whitespace-nowrap"
          style={{
            visibility: isOpen ? "visible" : "hidden",
            pointerEvents: isOpen ? "auto" : "none",
          }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3">
            <div className="flex flex-col gap-3">
              {/* Header */}
              <div className="text-center pb-1 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">
                  Help end the debate!
                </h4>
              </div>

              {/* Metrics */}
              <div className="flex flex-col gap-2">
                {metrics.map((metric, index) => {
                  const Icon = metric.icon;
                  const isComplete = metric.value === 100;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: metric.color }}
                          strokeWidth={2}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-900">
                            {metric.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {metric.description}
                          </span>
                        </div>
                      </div>
                      <span className={`text-sm ml-4 ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
                        {metric.value}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Overall Progress Bar */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Overall Progress</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {Math.round((participation + spiciness + agreement + minorityBuyIn) / 4)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E5DDD0' }}>
                  <motion.div
                    className="h-full"
                    style={{ 
                      background: 'linear-gradient(to right, #D4B896, #8B7355)'
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(participation + spiciness + agreement + minorityBuyIn) / 4}%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
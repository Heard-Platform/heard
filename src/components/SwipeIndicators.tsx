import { motion } from "motion/react";
import { XCircle, CheckCircle, Star, Ban } from "lucide-react";
import type { MotionValue } from "motion/react";

interface SwipeIndicatorProps {
  direction: "disagree" | "agree" | "superAgree" | "pass";
  opacity?: MotionValue<number> | number;
  className?: string;
  variant?: "default" | "compact";
}

// Shared configuration for all indicators
const BASE_CONFIGS = {
  disagree: {
    bg: "bg-red-500",
    icon: XCircle,
    position: { default: "top-8 left-8", compact: "top-4 left-4" },
    rotation: "rotate-[-25deg]",
  },
  agree: {
    bg: "bg-green-500",
    icon: CheckCircle,
    position: { default: "top-8 right-8", compact: "top-4 right-4" },
    rotation: "rotate-[25deg]",
  },
  superAgree: {
    bg: "bg-gradient-to-r from-green-500 to-green-600",
    icon: Star,
    position: { default: "top-8 left-1/2 transform -translate-x-1/2", compact: "top-4 left-1/2 transform -translate-x-1/2" },
    rotation: "",
    fill: true,
  },
  pass: {
    bg: "bg-gray-500",
    icon: Ban,
    position: { default: "bottom-8 left-1/2 transform -translate-x-1/2", compact: "bottom-4 left-1/2 transform -translate-x-1/2" },
    rotation: "",
  },
};

/**
 * Displays a swipe indicator badge (Disagree, Agree, Super Agree, or Pass)
 * Used in both the actual swipe card and the demo
 */
export function SwipeIndicator({ 
  direction, 
  opacity, 
  className = "", 
  variant = "default" 
}: SwipeIndicatorProps) {
  const config = BASE_CONFIGS[direction];
  const Icon = config.icon;
  const isCompact = variant === "compact";
  
  // Sizing classes based on variant
  const sizeClasses = isCompact 
    ? "px-3 py-1.5" 
    : "px-4 py-2";
  const iconSize = isCompact ? "w-5 h-5" : "w-8 h-8";
  const position = config.position[variant];

  return (
    <motion.div
      className={`absolute ${position} ${config.bg} text-white ${sizeClasses} rounded-lg text-xl ${config.rotation} shadow-lg ${isCompact ? "flex items-center gap-1" : ""} ${className}`}
      style={{
        opacity: opacity,
      }}
    >
      <Icon className={`${iconSize} ${config.fill ? "fill-white" : ""}`} />
    </motion.div>
  );
}

/**
 * Compact version for the demo - smaller size
 * @deprecated Use SwipeIndicator with variant="compact" instead
 */
export function SwipeIndicatorCompact(props: Omit<SwipeIndicatorProps, "variant">) {
  return <SwipeIndicator {...props} variant="compact" />;
}
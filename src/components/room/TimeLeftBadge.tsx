import { Badge } from "../ui/badge";
import { getTimeRemaining, ONE_WEEK_MS } from "../../utils/time";
import { useState, useEffect } from "react";

interface TimeLeftBadgeProps {
  endTime: number | undefined;
  createdAt: number;
  isRealtime: boolean;
  variant?: "badge" | "text";
}

export function TimeLeftBadge({
  endTime,
  createdAt,
  isRealtime,
  variant = "badge",
}: TimeLeftBadgeProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const effectiveEndTime = endTime || createdAt + ONE_WEEK_MS;
  const timeRemaining = getTimeRemaining(
    effectiveEndTime,
    currentTime,
  );

  if (!timeRemaining || !isRealtime) {
    return null;
  }

  const getEmoji = () => {
    return ["high", "critical"].includes(timeRemaining.urgency)
      ? "🔥"
      : "";
  };

  if (variant === "text") {
    const getTextStyles = () => {
      if (timeRemaining.urgency === "critical")
        return "text-red-600 font-bold animate-pulse";
      if (timeRemaining.urgency === "high")
        return "text-orange-500 font-semibold animate-pulse";
      if (timeRemaining.urgency === "medium")
        return "text-yellow-600 font-semibold";
      return "text-muted-foreground";
    };

    return (
      <span className={`text-xs shrink-0 ${getTextStyles()}`}>
        {getEmoji()} {timeRemaining.formatted} left
      </span>
    );
  } else {
    const getBadgeStyles = () => {
      if (timeRemaining.urgency === "critical")
        return "bg-red-600 animate-pulse shadow-lg shadow-red-500/50";
      if (timeRemaining.urgency === "high")
        return "bg-orange-600 animate-pulse shadow-md shadow-orange-500/30";
      if (timeRemaining.urgency === "medium")
        return "bg-yellow-600 animate-pulse";
      return "bg-green-700/70";
    };
  
    return (
      <Badge className={`heard-pill text-white ${getBadgeStyles()}`}>
        {getEmoji()} {timeRemaining.formatted} left
      </Badge>
    );
  }
}
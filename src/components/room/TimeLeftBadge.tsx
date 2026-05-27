// @ts-ignore
import { toast } from "sonner@2.0.3";
import { Badge } from "../ui/badge";
import { getTimeRemaining, ONE_WEEK_MS } from "../../utils/time";
import { useState, useEffect } from "react";
import moment from "moment";

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

  const prefix = ["high", "critical"].includes(timeRemaining.urgency) ? "🔥" : "🕐";

  const handleTap = () => {
    const humanized = moment.duration(effectiveEndTime - currentTime).humanize();
    toast(`Voting ends in ${humanized}`);
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
      <span className={`text-xs shrink-0 cursor-pointer ${getTextStyles()}`} onClick={handleTap}>
        {prefix} {timeRemaining.formatted}
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
      <Badge className={`heard-pill text-white cursor-pointer ${getBadgeStyles()}`} onClick={handleTap}>
        {prefix} {timeRemaining.formatted}
      </Badge>
    );
  }
}
import { Badge } from "../ui/badge";
import { getTimeRemaining, ONE_WEEK_MS } from "../../utils/time";
import { useState, useEffect } from "react";

interface TimeLeftBadgeProps {
  endTime: number | undefined;
  createdAt: number;
  isRealtime: boolean;
}

export function TimeLeftBadge({ endTime, createdAt, isRealtime }: TimeLeftBadgeProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const effectiveEndTime = endTime || createdAt + ONE_WEEK_MS;
  const timeRemaining = getTimeRemaining(effectiveEndTime, currentTime);

  if (!timeRemaining || !isRealtime) {
    return null;
  }

  const getUrgencyStyles = () => {
    if (timeRemaining.urgency === 'critical') {
      return 'bg-red-600 animate-pulse shadow-lg shadow-red-500/50';
    }
    if (timeRemaining.urgency === 'high') {
      return 'bg-orange-600 animate-pulse shadow-md shadow-orange-500/30';
    }
    if (timeRemaining.urgency === 'medium') {
      return 'bg-yellow-600 animate-pulse';
    }
    return 'bg-green-700/70';
  };

  const getEmoji = () => {
    return ['high', 'critical'].includes(timeRemaining.urgency) ? '🔥' : '';
  };

  return (
    <Badge className={`heard-pill text-white ${getUrgencyStyles()}`}>
      {getEmoji()} {timeRemaining.formatted} left
    </Badge>
  );
}
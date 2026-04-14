import moment from 'moment';

export function timeAgoShort(timestamp: number): string {
  const result = getTimeRemaining(Date.now(), timestamp);
  if (!result) return 'just now';
  return result.formatted;
}

export const ONE_WEEK_MIN = 7 * 24 * 60;
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type TimeUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface TimeRemaining {
  formatted: string;
  urgency: TimeUrgency;
}

export function getTimeRemaining(endTime: number, currentTime: number): TimeRemaining | null {
  const timeLeft = Math.max(0, endTime - currentTime);

  if (timeLeft === 0) {
    return null;
  }

  const duration = moment.duration(timeLeft);
  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();
  const seconds = duration.seconds();

  if (days > 0) {
    return { formatted: `${days}d`, urgency: 'low' };
  }

  if (hours > 0) {
    return { formatted: `${hours}h`, urgency: 'medium' };
  }

  if (minutes > 0) {
    return { formatted: `${minutes}m`, urgency: 'high' };
  }

  return { formatted: `${seconds}s`, urgency: 'critical' };
}

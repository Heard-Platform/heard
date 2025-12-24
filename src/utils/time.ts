import moment from 'moment';

export const ONE_WEEK_MIN = 7 * 24 * 60;
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type TimeUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface TimeRemaining {
  value: number;
  unit: string;
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
    return { value: days, unit: 'd', urgency: 'low' };
  }
  
  if (hours > 0) {
    return { value: hours, unit: 'h', urgency: 'medium' };
  }
  
  if (minutes > 0) {
    return { value: minutes, unit: 'm', urgency: 'high' };
  }
  
  return { value: seconds, unit: 's', urgency: 'critical' };
}

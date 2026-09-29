import type { User } from "./types.tsx";
import { formatCohortLabel, getWeekStart } from "./cohort-utils.ts";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface WeeklySignupCount {
  weekLabel: string;
  signups: number;
  weekStart: number;
}

export function buildWeeklySignups(users: User[], now: number): WeeklySignupCount[] {
  const signupsByWeek = new Map<number, number>();
  for (const user of users) {
    if (user.isAnonymous || !user.createdAt) continue;
    const week = getWeekStart(user.createdAt);
    signupsByWeek.set(week, (signupsByWeek.get(week) ?? 0) + 1);
  }

  if (signupsByWeek.size === 0) return [];

  const firstWeek = Math.min(...signupsByWeek.keys());
  const currentWeek = getWeekStart(now);
  const weeks: WeeklySignupCount[] = [];
  for (let week = firstWeek; week <= currentWeek; week += WEEK_MS) {
    weeks.push({
      weekLabel: formatCohortLabel(week),
      signups: signupsByWeek.get(week) ?? 0,
      weekStart: week,
    });
  }
  return weeks;
}

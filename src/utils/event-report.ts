import moment from "moment-timezone";
import type { EventReportOpening } from "../types";
import { ONE_MINUTE_MS } from "./time";

const SESSION_START_FORMAT = "dddd M/D · h:mm A z";

type SessionTimes = Pick<
  EventReportOpening,
  "sessionStartedAt" | "sessionEndedAt"
>;

export function getSessionMinutes(
  sessionTimes: SessionTimes,
): number {
  const sessionLengthMs =
    sessionTimes.sessionEndedAt - sessionTimes.sessionStartedAt;
  return Math.round(sessionLengthMs / ONE_MINUTE_MS);
}

export function formatSessionStart(
  sessionStartedAt: number,
  timeZone: string = moment.tz.guess(),
): string {
  return moment
    .tz(sessionStartedAt, timeZone)
    .format(SESSION_START_FORMAT);
}

export function formatCount(count: number): string {
  return count.toLocaleString("en-US");
}
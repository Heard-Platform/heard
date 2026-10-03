import moment from "npm:moment-timezone@0.6.5";

const RESULTS_TIME_ZONE = "America/New_York";
const RESULTS_HOUR = 19;

export const isAfterRevealTime = (time: number): boolean =>
  moment.tz(time, RESULTS_TIME_ZONE).hour() >= RESULTS_HOUR;

export const getLatestResultsTime = (time: number): number => {
  const resultsTime = moment.tz(time, RESULTS_TIME_ZONE).hour(RESULTS_HOUR).startOf("hour");
  if (resultsTime.valueOf() > time) resultsTime.subtract(1, "day");
  return resultsTime.valueOf();
};

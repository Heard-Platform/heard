import { parseArgs } from "@std/cli/parse-args";

export const DEFAULT_ATTENDEE_COUNT = 70;
export const MAXIMUM_ATTENDEE_COUNT = 500;
export const DEFAULT_JOIN_SECONDS = 60;

export const SIMULATION_USAGE =
  "Usage: npm run simulate-event -- [--people 70] [--join-seconds 60] [--event <id of an event you already made>]";

export interface SimulationOptions {
  attendeeCount: number;
  joinWindowMs: number;
  existingEventId: string | null;
}

export function parseSimulationOptions(commandLineArguments: string[]): SimulationOptions {
  const options = parseArgs(commandLineArguments, {
    string: ["people", "join-seconds", "event"],
    default: { people: String(DEFAULT_ATTENDEE_COUNT), "join-seconds": String(DEFAULT_JOIN_SECONDS) },
  });
  const attendeeCount = Number(options.people);
  const joinSeconds = Number(options["join-seconds"]);
  if (!Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > MAXIMUM_ATTENDEE_COUNT) {
    throw new Error(`--people must be a whole number from 1 to ${MAXIMUM_ATTENDEE_COUNT}.\n${SIMULATION_USAGE}`);
  }
  if (!Number.isFinite(joinSeconds) || joinSeconds < 0) {
    throw new Error(`--join-seconds must be 0 or more.\n${SIMULATION_USAGE}`);
  }
  return {
    attendeeCount,
    joinWindowMs: joinSeconds * 1000,
    existingEventId: options.event?.trim() || null,
  };
}

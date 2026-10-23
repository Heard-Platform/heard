import _ from "lodash";
import type { LiveEventView, Statement } from "../../src/types/index.ts";
import { type ApiCallRecord, HeardApiClient } from "../shared/heard-api-client.ts";
import {
  type HeardScriptEnvironment,
  loadHeardScriptEnvironment,
  requireModeratorSessionId,
} from "../shared/heard-script-environment.ts";
import { sleep } from "../shared/sleep.ts";
import { pickJoinDelayMs } from "./attendee-behavior.ts";
import { SimulatedAttendee } from "./simulated-attendee.ts";
import { buildSimulationEventLinks, createSimulationEvent } from "./simulation-event-setup.ts";
import { StateChangeTracker, VoteLedger } from "./simulation-measurements.ts";
import { parseSimulationOptions, type SimulationOptions } from "./simulation-options.ts";
import { formatProgressLine, formatSimulationReport, PROGRESS_WINDOW_MS } from "./simulation-report.ts";

const STOP_AFTER_END_MS = 5000;
const VOTE_SETTLE_MS = 3000;

interface SimulationRun {
  attendees: SimulatedAttendee[];
  records: ApiCallRecord[];
  stateChanges: StateChangeTracker;
  voteLedger: VoteLedger;
  latestEventState: LiveEventView | null;
  unexpectedErrors: string[];
}

async function runEventSimulation() {
  const options = parseSimulationOptions(Deno.args);
  const environment = await loadHeardScriptEnvironment();
  const moderatorApi = environment.moderatorSessionId
    ? new HeardApiClient(environment, environment.moderatorSessionId)
    : null;

  const eventId = options.existingEventId ??
    await createSimulationEvent(new HeardApiClient(environment, requireModeratorSessionId(environment)), new Date());
  const displayKey = moderatorApi ? (await moderatorApi.getEvent(eventId)).event.displayKey : null;
  printLinks(eventId, displayKey, options);

  const run = await simulateAttendees(environment, eventId, options);
  const simulationRecords = [...run.records];
  const voteCheck = await checkVotes(run, moderatorApi);
  console.log(`\n${
    formatSimulationReport({
      attendeeCount: options.attendeeCount,
      joinFailureCount: run.attendees.filter((attendee) => !attendee.hasJoined).length,
      records: simulationRecords,
      stateChanges: run.stateChanges.summarize(),
      totalVotesSent: run.voteLedger.totalVotesSent,
      undercountedVotes: voteCheck.serverStatements ? run.voteLedger.findUndercountedVotes(voteCheck.serverStatements) : [],
      voteCheckError: voteCheck.error,
    })
  }`);
  if (run.unexpectedErrors.length > 0) {
    console.log(`\nUNEXPECTED ERRORS\n${_.uniq(run.unexpectedErrors).map((message) => `  ${message}`).join("\n")}`);
  }
}

function printLinks(eventId: string, displayKey: string | null, options: SimulationOptions) {
  const links = buildSimulationEventLinks(eventId, displayKey);
  console.log(`Event ${eventId}`);
  console.log(`  Moderator controls: ${links.moderatorControls}`);
  console.log(`  Display:            ${links.display ?? "(set HEARD_MODERATOR_SESSION_ID to get the display link)"}`);
  console.log(`  Join as a phone:    ${links.phone}`);
  console.log(
    `\n${options.attendeeCount} simulated phones join over ${options.joinWindowMs / 1000}s. ` +
      "Run the event from the moderator controls. The simulation stops after you press End, or on Ctrl+C.\n",
  );
}

async function simulateAttendees(
  environment: HeardScriptEnvironment,
  eventId: string,
  options: SimulationOptions,
): Promise<SimulationRun> {
  const stopController = new AbortController();
  const stopOnInterrupt = () => stopController.abort();
  Deno.addSignalListener("SIGINT", stopOnInterrupt);

  const run: SimulationRun = {
    attendees: [],
    records: [],
    stateChanges: new StateChangeTracker(),
    voteLedger: new VoteLedger(),
    latestEventState: null,
    unexpectedErrors: [],
  };
  const recordApiCall = (record: ApiCallRecord) => run.records.push(record);
  let hasScheduledStop = false;
  const handleEventStateSeen = (eventState: LiveEventView) => {
    if (!run.latestEventState || eventState.updatedAt >= run.latestEventState.updatedAt) {
      run.latestEventState = eventState;
    }
    if (eventState.status === "ended" && !hasScheduledStop) {
      hasScheduledStop = true;
      setTimeout(() => stopController.abort(), STOP_AFTER_END_MS);
    }
  };

  run.attendees = _.range(1, options.attendeeCount + 1).map((attendeeNumber) =>
    new SimulatedAttendee(attendeeNumber, {
      api: new HeardApiClient(environment, null, recordApiCall),
      eventId,
      random: Math.random,
      stateChanges: run.stateChanges,
      voteLedger: run.voteLedger,
      onEventStateSeen: handleEventStateSeen,
    })
  );

  const startedAt = Date.now();
  const progressTimer = setInterval(() => {
    const now = Date.now();
    console.log(formatProgressLine({
      elapsedMs: now - startedAt,
      joinedCount: run.attendees.filter((attendee) => attendee.hasJoined).length,
      attendeeCount: options.attendeeCount,
      peopleHere: run.latestEventState?.peopleHere ?? null,
      recentRecords: run.records.filter((record) => now - record.finishedAt <= PROGRESS_WINDOW_MS),
    }));
  }, PROGRESS_WINDOW_MS);

  await Promise.all(run.attendees.map(async (attendee) => {
    await sleep(pickJoinDelayMs(Math.random, options.joinWindowMs), stopController.signal);
    if (stopController.signal.aborted) return;
    await attendee.run(stopController.signal).catch((error) =>
      run.unexpectedErrors.push(error instanceof Error ? error.message : String(error))
    );
  }));

  clearInterval(progressTimer);
  Deno.removeSignalListener("SIGINT", stopOnInterrupt);
  return run;
}

async function checkVotes(
  run: SimulationRun,
  moderatorApi: HeardApiClient | null,
): Promise<{ serverStatements: Statement[] | null; error: string | null }> {
  const checkingApi = moderatorApi ?? run.attendees.find((attendee) => attendee.hasJoined)?.api;
  const roomIds = run.latestEventState?.roomOrder ?? [];
  if (!checkingApi || roomIds.length === 0) {
    return { serverStatements: null, error: "no phone joined or the event never started" };
  }
  await sleep(VOTE_SETTLE_MS);
  try {
    const posts = await Promise.all(roomIds.map((roomId) => checkingApi.getPost(roomId)));
    return { serverStatements: posts.flatMap((post) => post.statements), error: null };
  } catch (error) {
    return { serverStatements: null, error: error instanceof Error ? error.message : String(error) };
  }
}

try {
  await runEventSimulation();
  Deno.exit(0);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  Deno.exit(1);
}

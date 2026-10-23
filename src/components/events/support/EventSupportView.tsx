import type {
  AttendeePhoneState,
  SupportViewAttendeeStatement,
  SupportViewCurrentPost,
  SupportViewStats,
} from "../../../types";
import { useNow } from "../../../hooks/useNow";
import {
  ATTENDEE_PHONE_STATES,
  describeSessionStatus,
  formatElapsed,
  getFinishedPercent,
  getVoteMixPercents,
  getVotesPerPerson,
  listPhoneStates,
} from "../../../utils/event-support";
import {
  AGREE_COLOR,
  ColorSwatch,
  SupportChip,
  SupportNote,
  SupportPanel,
  SupportTile,
  DISAGREE_COLOR,
  PASS_COLOR,
  PHONE_STATE_COLORS,
  PHONE_STATE_LABELS,
  StackedBar,
} from "./SupportParts";
import { JoinedOverTimeChart, TimePerPostChart, VotedOnEachPostChart, VotesPerMinuteChart } from "./SupportCharts";
import { AttendeeStatementsPanel } from "./AttendeeStatementsPanel";
import { ReloadAllPhonesButton } from "./ReloadAllPhonesButton";

const CLOCK_REFRESH_MS = 1000;
const SECOND_MS = 1000;

interface EventSupportViewProps {
  stats: SupportViewStats;
  updatingStatementIds: string[];
  isReloadingPhones: boolean;
  onSetStatementHidden: (statement: SupportViewAttendeeStatement, isHidden: boolean) => void;
  onReloadAllPhones: () => void;
}

export function EventSupportView({
  stats,
  updatingStatementIds,
  isReloadingPhones,
  onSetStatementHidden,
  onReloadAllPhones,
}: EventSupportViewProps) {
  const now = useNow(CLOCK_REFRESH_MS);
  const currentPostNumber = stats.currentPost?.postNumber ?? null;

  return (
    <div className="display-screen-bg min-h-dvh">
      <div className="mx-auto max-w-7xl space-y-4 p-6">
        <header className="flex flex-wrap items-center gap-2">
          <h1 className="mr-auto text-2xl font-extrabold tracking-tight">{stats.eventName}</h1>
          <SupportChip>{describeSessionStatus(stats)}</SupportChip>
          {stats.status === "live" && stats.currentPost && (
            <SupportChip>{formatElapsed(now - stats.currentPost.startedAt)} on this post</SupportChip>
          )}
          <SessionLengthChip startedAt={stats.startedAt} endedAt={stats.endedAt} now={now} />
        </header>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
          <SupportTile value={String(stats.peopleHere)} label="here" />
          <SupportTile value={String(stats.activeNow)} label="active now" />
          <SupportTile value={String(stats.votes)} label="votes" />
          <SupportTile value={String(stats.statementsFromRoom)} label="from the room" />
          <SupportTile value={String(getVotesPerPerson(stats.votes, stats.peopleHere))} label="votes per person" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <SupportPanel title="Where everyone is">
              <PhoneDots phoneCountsByState={stats.phoneCountsByState} />
            </SupportPanel>
            {stats.currentPost && <CurrentPostPanel currentPost={stats.currentPost} />}
          </div>

          <div className="space-y-4">
            <SupportPanel title="Votes per minute">
              <VotesPerMinuteChart minutes={stats.minutes} nextPressedAtMinutes={stats.nextPressedAtMinutes} />
              <SupportNote>Lines mark each Next</SupportNote>
            </SupportPanel>
            <SupportPanel title="Joined over time">
              <JoinedOverTimeChart minutes={stats.minutes} />
              <SupportNote>People who have voted, by minute</SupportNote>
            </SupportPanel>
          </div>

          <div className="space-y-4">
            <SupportPanel title="Voted on each post">
              <VotedOnEachPostChart postsSoFar={stats.postsSoFar} currentPostNumber={currentPostNumber} />
              <SupportNote>People who voted on each post</SupportNote>
            </SupportPanel>
            <SupportPanel title="Time per post">
              <TimePerPostChart postsSoFar={stats.postsSoFar} currentPostNumber={currentPostNumber} />
            </SupportPanel>
            <ReloadAllPhonesButton isReloadingPhones={isReloadingPhones} onReloadAllPhones={onReloadAllPhones} />
          </div>
        </div>

        <AttendeeStatementsPanel
          attendeeStatements={stats.attendeeStatements}
          updatingStatementIds={updatingStatementIds}
          now={now}
          onSetStatementHidden={onSetStatementHidden}
        />
      </div>
    </div>
  );
}

interface SessionLengthChipProps {
  startedAt: number | null;
  endedAt: number | null;
  now: number;
}

function SessionLengthChip({ startedAt, endedAt, now }: SessionLengthChipProps) {
  if (startedAt === null) return null;
  if (endedAt !== null) return <SupportChip>Ran {formatElapsed(endedAt - startedAt)}</SupportChip>;
  return <SupportChip>{formatElapsed(now - startedAt)} since Start</SupportChip>;
}

function PhoneDots({ phoneCountsByState }: { phoneCountsByState: Record<AttendeePhoneState, number> }) {
  const phoneStates = listPhoneStates(phoneCountsByState);
  const statesWithPhones = ATTENDEE_PHONE_STATES.filter((state) => phoneCountsByState[state] > 0);

  return (
    <>
      <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-1.5" aria-hidden>
        {phoneStates.map((state, index) => (
          <span
            key={index}
            className="aspect-square rounded-full transition-colors duration-500"
            style={{ backgroundColor: PHONE_STATE_COLORS[state] }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {statesWithPhones.map((state) => (
          <span key={state} className="flex items-center gap-1.5">
            <ColorSwatch color={PHONE_STATE_COLORS[state]} />
            {PHONE_STATE_LABELS[state]} <span className="font-semibold tabular-nums">{phoneCountsByState[state]}</span>
          </span>
        ))}
      </div>
    </>
  );
}

function CurrentPostPanel({ currentPost }: { currentPost: SupportViewCurrentPost }) {
  const finishedPercent = getFinishedPercent(currentPost);
  const voteMixPercents = getVoteMixPercents(currentPost);

  return (
    <SupportPanel title={`This post: Q${currentPost.postNumber}`}>
      <p className="line-clamp-2 font-semibold leading-snug">{currentPost.topic}</p>
      <StackedBar
        label={`${currentPost.finishedCount} finished, ${currentPost.swipingCount} swiping`}
        segments={[
          { key: "finished", percent: finishedPercent, color: PHONE_STATE_COLORS.waiting },
          { key: "swiping", percent: 100 - finishedPercent, color: PHONE_STATE_COLORS.swiping },
        ]}
      />
      <SupportNote>
        {currentPost.finishedCount} finished · {currentPost.swipingCount} swiping
        {currentPost.medianSecondsToFinish !== null &&
          ` · median ${formatElapsed(currentPost.medianSecondsToFinish * SECOND_MS)} to finish`}
      </SupportNote>
      <StackedBar
        label={`${voteMixPercents.agree}% agree, ${voteMixPercents.pass}% pass, ${voteMixPercents.disagree}% disagree`}
        segments={[
          { key: "agree", percent: voteMixPercents.agree, color: AGREE_COLOR },
          { key: "pass", percent: voteMixPercents.pass, color: PASS_COLOR },
          { key: "disagree", percent: voteMixPercents.disagree, color: DISAGREE_COLOR },
        ]}
      />
      <SupportNote>
        {voteMixPercents.agree}% agree · {voteMixPercents.pass}% pass · {voteMixPercents.disagree}% disagree
      </SupportNote>
    </SupportPanel>
  );
}

import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SupportViewMinute, SupportViewPost } from "../../../types";
import { formatElapsed } from "../../../utils/event-support";
import { pluralizePerson } from "../../../utils/text";
import { ACCENT_COLOR, AGREE_COLOR, MUTED_BAR_COLOR } from "./SupportParts";

const SECOND_MS = 1000;
const MINUTE_SECONDS = 60;
const LINE_CHART_HEIGHT_PX = 120;
const BAR_CHART_HEIGHT_PX = 110;

const CHART_CLASS_NAME =
  "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-cartesian-axis-line]:stroke-border";

const CHART_MARGIN = { top: 4, right: 8, left: 0, bottom: 0 };
const AXIS_TICK = { fontSize: 11 };

function ChartTooltipCard({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-0.5 rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      {children}
    </div>
  );
}

interface MinuteTooltipProps {
  active?: boolean;
  payload?: { payload: SupportViewMinute }[];
  describeMinute: (minute: SupportViewMinute) => string;
}

function MinuteTooltip({ active, payload, describeMinute }: MinuteTooltipProps) {
  const minute = payload?.[0]?.payload;
  if (!active || !minute) return null;
  return (
    <ChartTooltipCard>
      <p className="text-muted-foreground">Minute {minute.minuteSinceStart}</p>
      <p>{describeMinute(minute)}</p>
    </ChartTooltipCard>
  );
}

interface PostTooltipProps {
  active?: boolean;
  payload?: { payload: SupportViewPost }[];
  describePost: (post: SupportViewPost) => string;
}

function PostTooltip({ active, payload, describePost }: PostTooltipProps) {
  const post = payload?.[0]?.payload;
  if (!active || !post) return null;
  return (
    <ChartTooltipCard>
      <p className="text-muted-foreground">Post {post.postNumber}</p>
      <p>{describePost(post)}</p>
    </ChartTooltipCard>
  );
}

const MINUTE_X_AXIS_PROPS = {
  dataKey: "minuteSinceStart",
  type: "number" as const,
  domain: ["dataMin", "dataMax"] as [string, string],
  tick: AXIS_TICK,
  tickLine: false,
  allowDecimals: false,
  unit: "m",
};

export function VotesPerMinuteChart({
  minutes,
  nextPressedAtMinutes,
}: {
  minutes: SupportViewMinute[];
  nextPressedAtMinutes: number[];
}) {
  return (
    <div className={CHART_CLASS_NAME}>
      <ResponsiveContainer width="100%" height={LINE_CHART_HEIGHT_PX}>
        <LineChart data={minutes} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} />
          <XAxis {...MINUTE_X_AXIS_PROPS} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
          {nextPressedAtMinutes.map((minuteSinceStart) => (
            <ReferenceLine key={minuteSinceStart} x={minuteSinceStart} stroke="currentColor" strokeOpacity={0.25} />
          ))}
          <Tooltip
            content={<MinuteTooltip describeMinute={(minute) => `${minute.votes} votes`} />}
            cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          />
          <Line type="monotone" dataKey="votes" stroke={ACCENT_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function JoinedOverTimeChart({ minutes }: { minutes: SupportViewMinute[] }) {
  return (
    <div className={CHART_CLASS_NAME}>
      <ResponsiveContainer width="100%" height={LINE_CHART_HEIGHT_PX}>
        <LineChart data={minutes} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} />
          <XAxis {...MINUTE_X_AXIS_PROPS} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            content={<MinuteTooltip describeMinute={(minute) => `${minute.peopleJoined} joined`} />}
            cursor={{ stroke: "currentColor", strokeOpacity: 0.2 }}
          />
          <Line
            type="stepAfter"
            dataKey="peopleJoined"
            stroke={AGREE_COLOR}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PostBarChartProps {
  postsSoFar: SupportViewPost[];
  currentPostNumber: number | null;
}

export function VotedOnEachPostChart({ postsSoFar, currentPostNumber }: PostBarChartProps) {
  return (
    <div className={CHART_CLASS_NAME}>
      <ResponsiveContainer width="100%" height={BAR_CHART_HEIGHT_PX}>
        <BarChart data={postsSoFar} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="postNumber" tick={AXIS_TICK} tickLine={false} tickFormatter={(postNumber) => `Q${postNumber}`} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={32} />
          <Tooltip
            content={<PostTooltip describePost={(post) => `${post.voterCount} ${pluralizePerson(post.voterCount)} voted`} />}
            cursor={{ fill: "currentColor", opacity: 0.06 }}
          />
          <Bar dataKey="voterCount" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {postsSoFar.map((post) => (
              <Cell key={post.roomId} fill={post.postNumber === currentPostNumber ? ACCENT_COLOR : AGREE_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimePerPostChart({ postsSoFar, currentPostNumber }: PostBarChartProps) {
  const postsWithMinutes = postsSoFar.map((post) => ({ ...post, minutesOnPost: post.secondsOnPost / MINUTE_SECONDS }));
  return (
    <div className={CHART_CLASS_NAME}>
      <ResponsiveContainer width="100%" height={BAR_CHART_HEIGHT_PX}>
        <BarChart data={postsWithMinutes} margin={CHART_MARGIN}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="postNumber" tick={AXIS_TICK} tickLine={false} tickFormatter={(postNumber) => `Q${postNumber}`} />
          <YAxis allowDecimals={false} unit="m" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            content={<PostTooltip describePost={(post) => formatElapsed(post.secondsOnPost * SECOND_MS)} />}
            cursor={{ fill: "currentColor", opacity: 0.06 }}
          />
          <Bar dataKey="minutesOnPost" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {postsWithMinutes.map((post) => (
              <Cell key={post.roomId} fill={post.postNumber === currentPostNumber ? ACCENT_COLOR : MUTED_BAR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

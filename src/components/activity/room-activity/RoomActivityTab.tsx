import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RoomActivity, RoomVoteDepthBucket } from "../../../types";
import { Card } from "../../ui/card";
import { RoomSearchPicker, type RoomSearchOption } from "../../RoomSearchPicker";
import { SummaryStat } from "../../SummaryStat";
import {
  BAR_COLOR,
  BASELINE,
  CHART_TOOLTIP_STYLE,
  GRIDLINE,
  TEXT_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../chart-style";

interface RoomActivityTabProps {
  roomActivity: RoomActivity | null;
  roomActivityError: string | null;
  selectedRoomId: string;
  roomOptions: RoomSearchOption[];
  isLoadingRoomOptions: boolean;
  onSelectRoom: (roomId: string) => void;
}

const formatPercent = (percent: number) => `${Math.round(percent)}%`;

export function RoomActivityTab({
  roomActivity,
  roomActivityError,
  selectedRoomId,
  roomOptions,
  isLoadingRoomOptions,
  onSelectRoom,
}: RoomActivityTabProps) {
  return (
    <div className="space-y-6">
      <RoomSearchPicker
        rooms={roomOptions}
        selectedRoomId={selectedRoomId}
        placeholder="Choose a room…"
        loading={isLoadingRoomOptions}
        onSelect={onSelectRoom}
      />
      <RoomVoteDepthSection roomActivity={roomActivity} roomActivityError={roomActivityError} />
    </div>
  );
}

interface RoomVoteDepthSectionProps {
  roomActivity: RoomActivity | null;
  roomActivityError: string | null;
}

function RoomVoteDepthSection({ roomActivity, roomActivityError }: RoomVoteDepthSectionProps) {
  if (roomActivityError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {roomActivityError}</p>
      </div>
    );
  }

  if (!roomActivity) {
    return <p className="text-center text-muted-foreground py-8">Loading room activity...</p>;
  }

  const { voteDepth } = roomActivity;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <SummaryStat label="Voters" value={voteDepth.voterCount} />
        <SummaryStat label="Statements in room" value={voteDepth.statementCount} />
        <SummaryStat label="Median statements voted on" value={voteDepth.medianStatementsVotedOn} />
      </div>
      <Card className="p-6">
        <h2 className="text-xl mb-1">Voters who got at least this far</h2>
        <p className="text-xs mb-4" style={{ color: TEXT_MUTED }}>
          Each bar is how many voters voted on at least that many different statements, so the drop between bars is
          where people left. Passes count. Developers are left out.
        </p>
        <RoomVoteDepthChart buckets={voteDepth.buckets} hasVoters={voteDepth.voterCount > 0} />
      </Card>
    </>
  );
}

function RoomVoteDepthTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const bucket: RoomVoteDepthBucket = payload[0].payload;
  return (
    <div style={CHART_TOOLTIP_STYLE}>
      <p style={{ color: TEXT_SECONDARY, fontSize: 12, marginBottom: 2 }}>
        {bucket.statementsVotedOn}+ {bucket.statementsVotedOn === 1 ? "statement" : "statements"}
      </p>
      <p style={{ color: TEXT_PRIMARY, fontSize: 13, fontWeight: 600 }}>
        {bucket.reachedVoterCount} {bucket.reachedVoterCount === 1 ? "voter" : "voters"} (
        {formatPercent(bucket.reachedPercent)}) got at least this far
      </p>
      <p style={{ color: TEXT_SECONDARY, fontSize: 12 }}>{bucket.stoppedVoterCount} stopped here</p>
    </div>
  );
}

interface RoomVoteDepthChartProps {
  buckets: RoomVoteDepthBucket[];
  hasVoters: boolean;
}

function RoomVoteDepthChart({ buckets, hasVoters }: RoomVoteDepthChartProps) {
  if (!hasVoters) {
    return <p className="text-center text-muted-foreground py-8">No votes in this room yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={buckets} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke={GRIDLINE} />
        <XAxis
          dataKey="statementsVotedOn"
          tick={{ fontSize: 12, fill: TEXT_MUTED }}
          axisLine={{ stroke: BASELINE }}
          tickLine={false}
          minTickGap={8}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: TEXT_MUTED }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<RoomVoteDepthTooltip />} cursor={{ fill: GRIDLINE, opacity: 0.5 }} />
        <Bar dataKey="reachedVoterCount" name="Voters who got this far" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

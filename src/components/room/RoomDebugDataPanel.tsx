export interface RoomDebugParticipant {
  id: string;
  nickname: string;
  isAnonymous: boolean;
  convertedFromAnonAt?: number;
  createdAt: number;
  isHost: boolean;
  isCohost: boolean;
  isTestUser: boolean;
  webdriver: boolean;
  fingerprint?: string;
  ipAddress?: string;
}

export interface RoomDebugStatement {
  id: string;
  author: string;
  anonymousUserId?: string;
  text: string;
  isHidden: boolean;
  timestamp: number;
}

export interface RoomDebugVote {
  statementId: string;
  userId: string;
  voteType: string;
  anonymousUserId?: string;
  timestamp: number;
}

export interface RoomDebugEvent {
  type: string;
  userId: string | null;
  createdAt: number;
  url?: string;
  referralUserId?: string;
}

export interface RoomDebugView {
  userId: string;
  lastSeenAt: number;
}

export interface RoomDebugData {
  participants: RoomDebugParticipant[];
  getRoomParticipantsResult: string[];
  statements: RoomDebugStatement[];
  votes: RoomDebugVote[];
  events: RoomDebugEvent[];
  roomViews: RoomDebugView[];
}

function formatTs(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function DebugSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="text-xs font-medium mb-1.5">
        {title} <span className="text-muted-foreground">({count})</span>
      </h4>
      <div className="max-h-48 overflow-auto border rounded-md">
        {count === 0 ? (
          <div className="text-xs text-muted-foreground p-2">None</div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="w-full text-xs font-mono border-collapse">
      <thead className="sticky top-0 bg-muted">
        <tr>
          {headers.map((h) => (
            <th key={h} className="text-left font-medium px-2 py-1 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-t">
            {row.map((cell, j) => (
              <td key={j} className="px-2 py-1 whitespace-nowrap max-w-[220px] truncate" title={String(cell)}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RoomDebugDataPanel({ data }: { data: RoomDebugData }) {
  return (
    <div className="space-y-4">
      <DebugSection title="Participants (room.participants)" count={data.participants.length}>
        <Table
          headers={["id", "nickname", "anon", "convertedFromAnonAt", "host", "cohost", "test/bot", "fingerprint", "ip"]}
          rows={data.participants.map((p) => [
            p.id,
            p.nickname,
            p.isAnonymous ? "yes" : "no",
            p.convertedFromAnonAt ? formatTs(p.convertedFromAnonAt) : "—",
            p.isHost ? "yes" : "",
            p.isCohost ? "yes" : "",
            p.isTestUser || p.webdriver ? "yes" : "",
            p.fingerprint ?? "—",
            p.ipAddress ?? "—",
          ])}
        />
      </DebugSection>

      <DebugSection title="getRoomParticipants() result" count={data.getRoomParticipantsResult.length}>
        <Table
          headers={["id"]}
          rows={data.getRoomParticipantsResult.map((id) => [id])}
        />
      </DebugSection>

      <DebugSection title="Statements" count={data.statements.length}>
        <Table
          headers={["id", "author", "anonymousUserId", "hidden", "timestamp", "text"]}
          rows={data.statements.map((s) => [
            s.id,
            s.author,
            s.anonymousUserId ?? "—",
            s.isHidden ? "yes" : "",
            formatTs(s.timestamp),
            s.text,
          ])}
        />
      </DebugSection>

      <DebugSection title="Votes" count={data.votes.length}>
        <Table
          headers={["statementId", "userId", "voteType", "anonymousUserId", "timestamp"]}
          rows={data.votes.map((v) => [
            v.statementId,
            v.userId,
            v.voteType,
            v.anonymousUserId ?? "—",
            formatTs(v.timestamp),
          ])}
        />
      </DebugSection>

      <DebugSection title="User events (referral + initial_load)" count={data.events.length}>
        <Table
          headers={["type", "userId", "createdAt", "url", "referralUserId"]}
          rows={data.events.map((e) => [
            e.type,
            e.userId ?? "—",
            formatTs(e.createdAt),
            e.url ?? "—",
            e.referralUserId ?? "—",
          ])}
        />
      </DebugSection>

      <DebugSection title="Room views" count={data.roomViews.length}>
        <Table
          headers={["userId", "lastSeenAt"]}
          rows={data.roomViews.map((v) => [v.userId, formatTs(v.lastSeenAt)])}
        />
      </DebugSection>
    </div>
  );
}

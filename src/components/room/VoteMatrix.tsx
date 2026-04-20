import { ChevronRight, CheckSquare } from "lucide-react";
import { Statement, StatementMerge, VoteType } from "../../types";

const VOTE_COLORS: Record<VoteType, string> = {
  agree: "agree-bg",
  super_agree: "super-agree-bg",
  disagree: "disagree-bg",
  pass: "pass-bg",
};

const VOTE_LABELS: Record<VoteType, string> = {
  agree: "A",
  super_agree: "S",
  disagree: "D",
  pass: "P",
};

const CELL = "border inactive-border w-8 h-6";
const STATS_CELL = "text-center font-mono inactive-text-strong";
const COL_HEADER =
  "border inactive-border px-1 py-1 text-center inactive-text font-mono w-8";

function VoteCell({
  vote,
  isAuthor,
}: {
  vote: VoteType | undefined;
  isAuthor: boolean;
}) {
  const bgClass = vote ? VOTE_COLORS[vote] : "inactive-bg";
  const textClass = vote ? "normal-text" : "";
  const title = [isAuthor ? "author" : null, vote ?? null]
    .filter(Boolean)
    .join(" · ");

  if (!vote && !isAuthor) return <td className={CELL} />;

  return (
    <td
      className={`${CELL} text-center text-xs font-mono font-bold relative ${bgClass} ${textClass}`}
      title={title}
    >
      {vote ? VOTE_LABELS[vote] : ""}
      {isAuthor && <AuthorBadge />}
    </td>
  );
}

interface MergeInfo {
  sourceIds: Set<string>;
  targetOf: Map<string, string[]>;
  sourceOf: Map<string, string>;
}

function buildMergeInfo(merges: StatementMerge[]): MergeInfo {
  const sourceIds = new Set<string>();
  const targetOf = new Map<string, string[]>();
  const sourceOf = new Map<string, string>();

  for (const m of merges) {
    sourceIds.add(m.sourceStatementId);
    sourceOf.set(m.sourceStatementId, m.targetStatementId);
    const existing = targetOf.get(m.targetStatementId) ?? [];
    existing.push(m.sourceStatementId);
    targetOf.set(m.targetStatementId, existing);
  }
  return { sourceIds, targetOf, sourceOf };
}

const AuthorBadge = () => (
  <span className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full attention-background" />
);

interface VoteMatrixProps {
  statements: Statement[];
  merges: StatementMerge[];
  phoneVerified?: Record<string, boolean>;
  tableWrapperClassName?: string;
}

export function VoteMatrix({
  statements,
  merges,
  phoneVerified = {},
  tableWrapperClassName = "max-h-[calc(100vh-280px)]",
}: VoteMatrixProps) {
  const mergeInfo = buildMergeInfo(merges);

  const allUserIds = Array.from(
    new Set(
      statements.flatMap((s) => [
        s.author,
        ...Object.keys(s.voters ?? {}),
      ]),
    ),
  ).sort();

  if (statements.length === 0) {
    return (
      <p className="inactive-text text-sm py-4">
        No statements in this room.
      </p>
    );
  }

  const shortId = (id: string) => id.slice(-5);
  const stmtIndex = new Map(statements.map((s, i) => [s.id, i + 1]));

  return (
    <div className="flex flex-col gap-0 h-full">
      <div
        className={`overflow-auto w-full border rounded-t-lg flex-1 min-h-0 ${tableWrapperClassName}`}
      >
        <table className="border-collapse text-xs">
          <thead className="sticky top-0 z-10 normal-bg">
            <tr>
              <th className="sticky left-0 z-20 normal-bg border inactive-border px-2 py-1 text-left font-medium inactive-text min-w-[220px]">
                Statement
              </th>
              <th className={COL_HEADER} title="Agrees">
                A
              </th>
              <th className={COL_HEADER} title="Disagrees">
                D
              </th>
              <th className={COL_HEADER} title="Passes">
                P
              </th>
              {allUserIds.map((uid) => (
                <th
                  key={uid}
                  className="border inactive-border w-8 px-0"
                  title={uid}
                >
                  <div
                    className="inactive-text-soft font-mono overflow-hidden relative"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                      height: 75,
                      fontSize: 10,
                      lineHeight: "32px",
                    }}
                  >
                    {shortId(uid)}
                    {phoneVerified[uid] && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-green-500"
                        style={{
                          writingMode: "horizontal-tb",
                          transform: "rotate(90deg)",
                          translate: "0, 50%",
                        }}
                      >
                        <CheckSquare className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {statements.map((stmt) => {
              const idx = stmtIndex.get(stmt.id)!;
              const isMergeSource = mergeInfo.sourceIds.has(stmt.id);
              const targetId = mergeInfo.sourceOf.get(stmt.id);
              const targetIdx = targetId
                ? stmtIndex.get(targetId)
                : undefined;
              const incomingSources = mergeInfo.targetOf.get(stmt.id);

              return (
                <tr
                  key={stmt.id}
                  className={
                    isMergeSource
                      ? "bg-orange-50 opacity-60"
                      : "hover:bg-slate-50"
                  }
                >
                  <td className="sticky left-0 z-10 border inactive-border px-2 py-1 max-w-[220px] bg-inherit">
                    <div className="flex items-start gap-1">
                      <span className="text-slate-400 font-mono shrink-0">
                        {idx}.
                      </span>
                      <div className="min-w-0">
                        <p
                          className="truncate text-slate-800"
                          title={stmt.text}
                        >
                          {stmt.text}
                        </p>
                        {isMergeSource && targetIdx && (
                          <span className="inline-flex items-center gap-0.5 text-orange-500 font-medium mt-0.5">
                            <ChevronRight className="w-3 h-3" />
                            merged into #{targetIdx}
                          </span>
                        )}
                        {incomingSources &&
                          incomingSources.length > 0 && (
                            <span className="inline-block text-blue-500 font-medium mt-0.5">
                              ← from{" "}
                              {incomingSources
                                .map(
                                  (sid) => `#${stmtIndex.get(sid)}`,
                                )
                                .join(", ")}
                            </span>
                          )}
                      </div>
                    </div>
                  </td>
                  <td
                    className={`${CELL} ${STATS_CELL}`}
                  >
                    {stmt.agrees + stmt.superAgrees}
                  </td>
                  <td
                    className={`${CELL} ${STATS_CELL}`}
                  >
                    {stmt.disagrees}
                  </td>
                  <td
                    className={`${CELL} ${STATS_CELL}`}
                  >
                    {stmt.passes}
                  </td>
                  {allUserIds.map((uid) => (
                    <VoteCell
                      key={uid}
                      vote={stmt.voters?.[uid]}
                      isAuthor={uid === stmt.author}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 px-3 py-2 border border-t-0 rounded-b-lg bg-slate-50 text-xs inactive-text">
        {(
          ["agree", "super_agree", "disagree", "pass"] as VoteType[]
        ).map((v) => (
          <span key={v} className="flex items-center gap-1">
            <span
              className={`inline-block w-4 h-4 rounded ${VOTE_COLORS[v]}`}
            />
            {VOTE_LABELS[v]} = {v.replace("_", " ")}
          </span>
        ))}
        <span className="flex items-center gap-1">
          <span className="relative inline-block w-4 h-4 rounded strong-neutral-bg">
            <AuthorBadge />
          </span>
          = author
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare className="w-3 h-3 resolved-text" />= phone verified
        </span>
        {merges.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-4 rounded attention-bg border attention-border" />
            dimmed = merged source
          </span>
        )}
      </div>
    </div>
  );
}

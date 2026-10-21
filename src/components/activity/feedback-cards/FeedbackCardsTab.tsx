import type { FeedbackCardResults, FeedbackCardStatementResult } from "../../../types";
import { getFeedbackStatement } from "../../../utils/constants/feedback-statements";
import { Card } from "../../ui/card";

interface FeedbackCardsTabProps {
  results: FeedbackCardResults;
}

const formatDate = (value: number | string) => new Date(value).toLocaleString();

const shortUserId = (userId: string) => userId.substring(0, 8);

const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function FeedbackCardsTab({ results }: FeedbackCardsTabProps) {
  const noteRate = percent(results.usersWithNote, results.usersShown);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryStat label="Users shown a card" value={results.usersShown} />
        <SummaryStat label="Users who answered" value={results.usersAnswered} />
        <SummaryStat label="Users who wrote a note" value={results.usersWithNote} />
        <SummaryStat label="Note rate" value={`${noteRate}%`} />
      </div>

      <Card className="p-6">
        <h2 className="text-xl mb-1">Answers by statement</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Real, non-developer users. Agree includes super agree.
        </p>
        <div className="space-y-4">
          {results.statements.map((statement) => (
            <StatementSplit key={statement.statementKey} result={statement} />
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl mb-4">Founder chat opt-ins ({results.founderOptIns.length})</h2>
        {results.founderOptIns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No opt-ins yet.</p>
        ) : (
          <ul className="divide-y">
            {results.founderOptIns.map((optIn) => (
              <li key={optIn.userId} className="py-2 flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">{optIn.email ?? "No email yet"}</span>
                <span className="text-muted-foreground">
                  {shortUserId(optIn.userId)} · {formatDate(optIn.votedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl mb-4">Notes ({results.notes.length})</h2>
        {results.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {results.notes.map((note) => (
              <li key={note.id} className="border rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  On "{getFeedbackStatement(note.statementKey).text}" · {shortUserId(note.userId)} ·{" "}
                  {formatDate(note.createdAt)}
                </p>
                <p className="text-sm whitespace-pre-wrap">{note.text}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}

function StatementSplit({ result }: { result: FeedbackCardStatementResult }) {
  const agree = result.agree + result.superAgree;
  const segments = [
    { label: "Agree", count: agree, className: "bg-green-500" },
    { label: "Disagree", count: result.disagree, className: "bg-red-500" },
    { label: "Pass", count: result.pass, className: "bg-gray-400" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <p className="text-sm font-medium">{getFeedbackStatement(result.statementKey).text}</p>
        <p className="text-xs text-muted-foreground shrink-0">{result.total} answers</p>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={segment.className}
            style={{ width: `${percent(segment.count, result.total)}%` }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {segments.map((segment) => `${segment.label} ${segment.count}`).join(" · ")}
      </p>
    </div>
  );
}

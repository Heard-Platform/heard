import type { RoomAwaitingApproval, Statement } from "../../types";

interface StatementApprovalScreenProps {
  rooms: RoomAwaitingApproval[];
  decidingStatementId: string | null;
  error: string | null;
  onApprove: (statement: Statement) => void;
  onReject: (statement: Statement) => void;
}

export function StatementApprovalScreen({
  rooms,
  decidingStatementId,
  error,
  onApprove,
  onReject,
}: StatementApprovalScreenProps) {
  return (
    <div className="heard-page-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-xl font-bold dark-text">
          Statements awaiting approval
        </h1>
        {error && <p className="text-sm error-text">{error}</p>}
        {rooms.length === 0 && (
          <p className="secondary-text">Nothing to review 🎉</p>
        )}
        {rooms.map((room) => (
          <section key={room.roomId} className="space-y-3">
            <h2 className="text-sm font-semibold secondary-text">
              {room.topic}
            </h2>
            {room.statements.map((statement) => (
              <StatementApprovalCard
                key={statement.id}
                statement={statement}
                isDeciding={decidingStatementId === statement.id}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

interface StatementApprovalCardProps {
  statement: Statement;
  isDeciding: boolean;
  onApprove: (statement: Statement) => void;
  onReject: (statement: Statement) => void;
}

function StatementApprovalCard({
  statement,
  isDeciding,
  onApprove,
  onReject,
}: StatementApprovalCardProps) {
  return (
    <div className="rounded-2xl normal-bg p-4 shadow-sm">
      <p className="text-base dark-text">{statement.text}</p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-xl py-2.5 font-bold normal-text disabled:opacity-60 disagree-bg"
          disabled={isDeciding}
          onClick={() => onReject(statement)}
        >
          Reject
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl py-2.5 font-bold normal-text disabled:opacity-60 agree-bg"
          disabled={isDeciding}
          onClick={() => onApprove(statement)}
        >
          Approve
        </button>
      </div>
    </div>
  );
}

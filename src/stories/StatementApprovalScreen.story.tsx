import { useState } from "react";
import { StatementApprovalScreen } from "../components/statement-approval/StatementApprovalScreen";
import { StatementApprovalContainer } from "../components/statement-approval/StatementApprovalContainer";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { mockUser } from "./mockData";
import type { RoomAwaitingApproval, Statement } from "../types";

const makeStatement = (
  id: string,
  roomId: string,
  text: string,
): Statement => ({
  id,
  text,
  author: "story-user",
  agrees: 0,
  disagrees: 0,
  passes: 0,
  superAgrees: 0,
  roomId,
  timestamp: 0,
  round: 1,
  voters: {},
  isHidden: true,
  hiddenBy: "statement-approval",
});

const STORY_ROOMS: RoomAwaitingApproval[] = [
  {
    roomId: "hot-dog",
    topic: "Is a hot dog a sandwich?",
    statements: [
      makeStatement(
        "s1",
        "hot-dog",
        "If a sub is a sandwich, a hot dog is a sandwich. Fight me.",
      ),
      makeStatement(
        "s2",
        "hot-dog",
        "A hot dog is a taco and I will not be taking questions.",
      ),
    ],
  },
  {
    roomId: "pizza",
    topic: "Pineapple on pizza",
    statements: [
      makeStatement(
        "s3",
        "pizza",
        "Pineapple on pizza should be illegal within DC limits.",
      ),
    ],
  },
  {
    roomId: "planes",
    topic: "Airplane etiquette",
    statements: [
      makeStatement(
        "s4",
        "planes",
        "Reclining your seat on a short flight should come with a fine.",
      ),
      makeStatement(
        "s5",
        "planes",
        "The middle seat gets both armrests. This is not up for debate.",
      ),
      makeStatement(
        "s6",
        "planes",
        "Clapping when the plane lands is the best part of flying.",
      ),
    ],
  },
];

export function StatementApprovalScreenStory() {
  const [rooms, setRooms] = useState(STORY_ROOMS);
  const [hasError, setHasError] = useState(false);
  const [isNotDeveloper, setIsNotDeveloper] = useState(false);

  const handleRemoveStatement = (decidedStatement: Statement) =>
    setRooms(
      rooms
        .map((room) => ({
          ...room,
          statements: room.statements.filter(
            (statement) => statement.id !== decidedStatement.id,
          ),
        }))
        .filter((room) => room.statements.length > 0),
    );
  const handleReset = () => setRooms(STORY_ROOMS);
  const handleShowEmpty = () => setRooms([]);
  const handleToggleError = () => setHasError(!hasError);
  const handleToggleNotDeveloper = () =>
    setIsNotDeveloper(!isNotDeveloper);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 p-4">
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={handleShowEmpty}
        >
          Nothing to review
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={handleToggleError}
        >
          {hasError ? "Hide error" : "Show error"}
        </button>
        <button
          type="button"
          className="rounded border px-3 py-1 text-sm"
          onClick={handleToggleNotDeveloper}
        >
          {isNotDeveloper ? "Developer" : "Not a developer"}
        </button>
      </div>
      {isNotDeveloper ? (
        <DebateSessionProvider
          showcaseOverrides={{
            user: { ...mockUser, isDeveloper: false },
          }}
        >
          <StatementApprovalContainer />
        </DebateSessionProvider>
      ) : (
        <StatementApprovalScreen
          rooms={rooms}
          decidingStatementId={null}
          error={hasError ? "Couldn't save the decision" : null}
          onApprove={handleRemoveStatement}
          onReject={handleRemoveStatement}
        />
      )}
    </div>
  );
}

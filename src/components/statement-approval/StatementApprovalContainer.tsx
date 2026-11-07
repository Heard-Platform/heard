import { useEffect, useState } from "react";
import type {
  RoomAwaitingApproval,
  Statement,
  StatementApprovalDecision,
} from "../../types";
import { api } from "../../utils/api";
import { useDebateSession } from "../../hooks/useDebateSession";
import { Loader } from "../widgets/Loader";
import { StatementApprovalScreen } from "./StatementApprovalScreen";

const NOT_A_DEVELOPER_MESSAGE =
  "Sign in with a developer account to approve statements.";
const LOAD_ERROR = "Couldn't load statements awaiting approval";
const DECIDE_ERROR = "Couldn't save the decision";

export function StatementApprovalContainer() {
  const { user, loading } = useDebateSession();
  const isDeveloper = !!user?.isDeveloper;
  const [rooms, setRooms] = useState<RoomAwaitingApproval[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [decidingStatementId, setDecidingStatementId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isDeveloper) return;
    let isCancelled = false;
    const loadRooms = async () => {
      const response = await api.getRoomsAwaitingApproval();
      if (isCancelled) return;
      if (response.success && response.data) {
        setRooms(response.data.rooms);
      } else {
        setError(response.error || LOAD_ERROR);
      }
    };
    loadRooms();
    return () => {
      isCancelled = true;
    };
  }, [isDeveloper]);

  const removeStatement = (
    currentRooms: RoomAwaitingApproval[],
    decidedStatement: Statement,
  ): RoomAwaitingApproval[] => {
    const roomsWithoutStatement = currentRooms.map((room) => ({
      ...room,
      statements: room.statements.filter(
        (statement) => statement.id !== decidedStatement.id,
      ),
    }));
    return roomsWithoutStatement.filter(
      (room) => room.statements.length > 0,
    );
  };

  const handleDecide = async (
    statement: Statement,
    decision: StatementApprovalDecision,
  ) => {
    setDecidingStatementId(statement.id);
    setError(null);
    const response = await api.decideStatementApproval(
      statement.roomId,
      statement.id,
      decision,
    );
    setDecidingStatementId(null);
    if (response.success) {
      setRooms((current) =>
        current ? removeStatement(current, statement) : current,
      );
    } else {
      setError(response.error || DECIDE_ERROR);
    }
  };

  const handleApprove = (statement: Statement) =>
    handleDecide(statement, "approve");
  const handleReject = (statement: Statement) =>
    handleDecide(statement, "reject");

  if (!loading && !isDeveloper) {
    return <FailMessage message={NOT_A_DEVELOPER_MESSAGE} />;
  }

  if (rooms) {
    return (
      <StatementApprovalScreen
        rooms={rooms}
        decidingStatementId={decidingStatementId}
        error={error}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    );
  }

  if (error) return <FailMessage message={error} />;

  return (
    <div className="flex h-dvh items-center justify-center">
      <Loader />
    </div>
  );
}

function FailMessage({ message }: { message: string }) {
  return <p className="p-6 text-center secondary-text">{message}</p>;
}

import { toast } from "sonner";
import { useCallback, useRef, useState } from "react";
import type {
  EventApprovalView,
  SupportViewAttendeeStatement,
} from "../../../types";
import { useNow } from "../../../hooks/useNow";
import { usePolling } from "../../../hooks/usePolling";
import { api } from "../../../utils/api";
import { getStatementVisibilityEventName } from "../../../utils/event-support";
import { Loader } from "../../widgets/Loader";
import { EventApproval } from "./EventApproval";

const APPROVAL_POLL_MS = 3000;
const CLOCK_REFRESH_MS = 1000;

interface EventApprovalContainerProps {
  eventId: string;
  displayKey: string | null;
}

export function EventApprovalContainer({
  eventId,
  displayKey,
}: EventApprovalContainerProps) {
  const now = useNow(CLOCK_REFRESH_MS);
  const { approval, error, applyStatementVisibility } = useEventApproval(
    eventId,
    displayKey,
  );
  const [updatingStatementIds, setUpdatingStatementIds] = useState<
    string[]
  >([]);

  const handleSetStatementHidden = async (
    statement: SupportViewAttendeeStatement,
    isHidden: boolean,
  ) => {
    setUpdatingStatementIds((current) => [...current, statement.id]);
    const response = await api.setEventStatementHidden(
      eventId,
      statement.id,
      isHidden,
      displayKey,
    );
    if (response.success) {
      api.trackEvent(
        getStatementVisibilityEventName(statement, isHidden),
        statement.roomId,
      );
      applyStatementVisibility(statement.id, isHidden);
    } else {
      toast.error(response.error || "Couldn't update that statement");
    }
    setUpdatingStatementIds((current) =>
      current.filter((statementId) => statementId !== statement.id),
    );
  };

  if (!approval) {
    return error ? (
      <p className="p-6 text-center secondary-text">{error}</p>
    ) : (
      <div className="flex h-dvh items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <EventApproval
      eventName={approval.eventName}
      attendeeStatements={approval.attendeeStatements}
      updatingStatementIds={updatingStatementIds}
      now={now}
      onSetStatementHidden={handleSetStatementHidden}
    />
  );
}

function useEventApproval(eventId: string, displayKey: string | null) {
  const [approval, setApproval] = useState<EventApprovalView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestApprovalChangeNumberRef = useRef(0);

  const startApprovalChange = () => {
    latestApprovalChangeNumberRef.current += 1;
    return latestApprovalChangeNumberRef.current;
  };

  const refresh = useCallback(async (): Promise<boolean> => {
    const changeNumber = startApprovalChange();
    const response = await api.getEventApproval(eventId, displayKey);
    const isOvertaken =
      changeNumber !== latestApprovalChangeNumberRef.current;
    if (isOvertaken) return response.success;
    if (response.success && response.data) {
      setApproval(response.data.approval);
      setError(null);
      return true;
    }
    setError(response.error || "Couldn't load the statements");
    return false;
  }, [eventId, displayKey]);

  const applyStatementVisibility = useCallback(
    (statementId: string, isHidden: boolean) => {
      startApprovalChange();
      setApproval((current) =>
        current && {
          ...current,
          attendeeStatements: current.attendeeStatements.map(
            (statement) =>
              statement.id === statementId
                ? { ...statement, isHidden, isAwaitingApproval: false }
                : statement,
          ),
        },
      );
    },
    [],
  );

  usePolling(refresh, APPROVAL_POLL_MS, true);

  return { approval, error, applyStatementVisibility };
}

import { toast } from "sonner";
import { useCallback, useRef, useState } from "react";
import type { SupportViewAttendeeStatement, SupportViewStats } from "../../../types";
import { usePolling } from "../../../hooks/usePolling";
import { api } from "../../../utils/api";
import { getStatementVisibilityEventName } from "../../../utils/event-support";
import { Loader } from "../../widgets/Loader";
import { EventSupportView } from "./EventSupportView";

const SUPPORT_VIEW_POLL_MS = 4000;

interface EventSupportViewContainerProps {
  eventId: string;
  displayKey: string | null;
}

export function EventSupportViewContainer({ eventId, displayKey }: EventSupportViewContainerProps) {
  const { stats, error, applyStatementVisibility } = useSupportViewStats(
    eventId,
    displayKey,
  );
  const [updatingStatementIds, setUpdatingStatementIds] = useState<string[]>([]);
  const [isReloadingPhones, setIsReloadingPhones] = useState(false);

  const handleSetStatementHidden = async (statement: SupportViewAttendeeStatement, isHidden: boolean) => {
    setUpdatingStatementIds((current) => [...current, statement.id]);
    const response = await api.setEventStatementHidden(eventId, statement.id, isHidden, displayKey);
    if (response.success) {
      api.trackEvent(
        getStatementVisibilityEventName(statement, isHidden),
        statement.roomId,
      );
      applyStatementVisibility(statement.id, isHidden);
    } else {
      toast.error(response.error || "Couldn't update that statement");
    }
    setUpdatingStatementIds((current) => current.filter((statementId) => statementId !== statement.id));
  };

  const handleReloadAllPhones = async () => {
    setIsReloadingPhones(true);
    const response = await api.updateLiveEvent(eventId, { action: "reload" }, displayKey ?? undefined);
    if (response.success) {
      toast.success("Every phone is reloading");
    } else {
      toast.error(response.error || "Couldn't reload the phones");
    }
    setIsReloadingPhones(false);
  };

  if (!stats) {
    return error ? (
      <p className="p-6 text-center text-muted-foreground">{error}</p>
    ) : (
      <div className="flex h-dvh items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <EventSupportView
      stats={stats}
      updatingStatementIds={updatingStatementIds}
      isReloadingPhones={isReloadingPhones}
      onSetStatementHidden={handleSetStatementHidden}
      onReloadAllPhones={handleReloadAllPhones}
    />
  );
}

function useSupportViewStats(eventId: string, displayKey: string | null) {
  const [stats, setStats] = useState<SupportViewStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latestStatsChangeNumberRef = useRef(0);

  const startStatsChange = () => {
    latestStatsChangeNumberRef.current += 1;
    return latestStatsChangeNumberRef.current;
  };

  const refresh = useCallback(async (): Promise<boolean> => {
    const changeNumber = startStatsChange();
    const response = await api.getSupportView(eventId, displayKey);
    const isOvertaken = changeNumber !== latestStatsChangeNumberRef.current;
    if (isOvertaken) return response.success;
    if (response.success && response.data) {
      setStats(response.data.stats);
      setError(null);
      return true;
    }
    setError(response.error || "Couldn't load the support view");
    return false;
  }, [eventId, displayKey]);

  const applyStatementVisibility = useCallback(
    (statementId: string, isHidden: boolean) => {
      startStatsChange();
      setStats((current) =>
        current && {
          ...current,
          attendeeStatements: current.attendeeStatements.map((statement) =>
            statement.id === statementId
              ? { ...statement, isHidden, isAwaitingApproval: false }
              : statement,
          ),
        },
      );
    },
    [],
  );

  usePolling(refresh, SUPPORT_VIEW_POLL_MS, true);

  return { stats, error, applyStatementVisibility };
}

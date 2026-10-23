import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import type { SupportViewAttendeeStatement, SupportViewStats } from "../../../types";
import { api } from "../../../utils/api";
import { Loader } from "../../widgets/Loader";
import { EventSupportView } from "./EventSupportView";

const SUPPORT_VIEW_POLL_MS = 5000;

interface EventSupportViewContainerProps {
  eventId: string;
  displayKey: string | null;
}

export function EventSupportViewContainer({ eventId, displayKey }: EventSupportViewContainerProps) {
  const { stats, error, refresh } = useSupportViewStats(eventId, displayKey);
  const [updatingStatementIds, setUpdatingStatementIds] = useState<string[]>([]);
  const [isReloadingPhones, setIsReloadingPhones] = useState(false);

  const handleSetStatementHidden = async (statement: SupportViewAttendeeStatement, isHidden: boolean) => {
    setUpdatingStatementIds((current) => [...current, statement.id]);
    const response = await api.setEventStatementHidden(eventId, statement.id, isHidden, displayKey);
    if (response.success) {
      api.trackEvent(isHidden ? "live_statement_hidden" : "live_statement_unhidden", statement.roomId);
      await refresh();
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

  const refresh = useCallback(async () => {
    const response = await api.getSupportView(eventId, displayKey);
    if (response.success && response.data) {
      setStats(response.data.stats);
      setError(null);
    } else {
      setError(response.error || "Couldn't load the support view");
    }
  }, [eventId, displayKey]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, SUPPORT_VIEW_POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  return { stats, error, refresh };
}

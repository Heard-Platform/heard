import { toast } from "sonner";
import { useCallback, useState } from "react";
import type { SupportViewStats } from "../../../types";
import { usePolling } from "../../../hooks/usePolling";
import { api } from "../../../utils/api";
import { Loader } from "../../widgets/Loader";
import { EventSupportView } from "./EventSupportView";

const SUPPORT_VIEW_POLL_MS = 30_000;

interface EventSupportViewContainerProps {
  eventId: string;
  displayKey: string | null;
}

export function EventSupportViewContainer({ eventId, displayKey }: EventSupportViewContainerProps) {
  const { stats, error } = useSupportViewStats(eventId, displayKey);
  const [isReloadingPhones, setIsReloadingPhones] = useState(false);

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
      isReloadingPhones={isReloadingPhones}
      onReloadAllPhones={handleReloadAllPhones}
    />
  );
}

function useSupportViewStats(eventId: string, displayKey: string | null) {
  const [stats, setStats] = useState<SupportViewStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<boolean> => {
    const response = await api.getSupportView(eventId, displayKey);
    if (response.success && response.data) {
      setStats(response.data.stats);
      setError(null);
      return true;
    }
    setError(response.error || "Couldn't load the support view");
    return false;
  }, [eventId, displayKey]);

  usePolling(refresh, SUPPORT_VIEW_POLL_MS, true);

  return { stats, error };
}

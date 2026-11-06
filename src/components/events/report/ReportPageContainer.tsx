import { useEffect, useState } from "react";
import type { EventReport } from "../../../types";
import { api } from "../../../utils/api";
import { Loader } from "../../widgets/Loader";
import { ReportPage } from "./ReportPage";

const REPORT_LOAD_ERROR = "Couldn't load this report";
const REPORT_OPENED_EVENT = "report_opened";

interface ReportPageContainerProps {
  eventId: string;
}

export function ReportPageContainer({
  eventId,
}: ReportPageContainerProps) {
  const { report, error } = useEventReport(eventId);

  if (report) return <ReportPage report={report} />;

  if (error) {
    return (
      <p className="p-6 text-center text-muted-foreground">{error}</p>
    );
  }

  return (
    <div className="flex h-dvh items-center justify-center">
      <Loader />
    </div>
  );
}

function useEventReport(eventId: string) {
  const [report, setReport] = useState<EventReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const loadReport = async () => {
      const response = await api.getEventReport(eventId);
      if (isCancelled) return;
      if (response.success && response.data) {
        setReport(response.data.report);
        api.trackEvent(REPORT_OPENED_EVENT);
      } else {
        setError(response.error || REPORT_LOAD_ERROR);
      }
    };
    loadReport();
    return () => {
      isCancelled = true;
    };
  }, [eventId]);

  return { report, error };
}

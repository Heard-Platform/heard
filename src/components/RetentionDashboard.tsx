import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, TrendingUp } from "lucide-react";
import { api } from "../utils/api";
import type { CohortFunnelEntry } from "../types";
import { CohortFunnelChart } from "./CohortFunnelChart";

interface RetentionDashboardProps {
  onExit?: () => void;
}

export function RetentionDashboard({ onExit }: RetentionDashboardProps) {
  const [cohorts, setCohorts] = useState<CohortFunnelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      const res = await api.getCohortFunnel();
      if (!cancelled && res.success) {
        setCohorts(res.data?.cohorts ?? []);
      }
      if (!cancelled) setLoading(false);
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="heard-page-bg p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="heard-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl">Retention Dashboard</h1>
          </div>
          {onExit && (
            <Button variant="outline" onClick={onExit}>
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Cohort Funnel by Join Week
          </h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading cohorts...</p>
          ) : (
            <CohortFunnelChart cohorts={cohorts} />
          )}
        </Card>
      </div>
    </div>
  );
}

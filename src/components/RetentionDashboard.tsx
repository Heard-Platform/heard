import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, TrendingUp, Users } from "lucide-react";
import { api } from "../utils/api";
import type { CohortFunnelEntry, UserRetentionRow } from "../types";
import { CohortFunnelChart } from "./CohortFunnelChart";
import { UserRetentionTable } from "./UserRetentionTable";

interface RetentionDashboardProps {
  onExit?: () => void;
}

export function RetentionDashboard({ onExit }: RetentionDashboardProps) {
  const [cohorts, setCohorts] = useState<CohortFunnelEntry[]>([]);
  const [users, setUsers] = useState<UserRetentionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      const [cohortRes, usersRes] = await Promise.all([
        api.getCohortFunnel(),
        api.getUserRetentionTable(),
      ]);
      if (!cancelled) {
        if (cohortRes.success) setCohorts(cohortRes.data?.cohorts ?? []);
        if (usersRes.success) setUsers(usersRes.data?.users ?? []);
        setLoading(false);
      }
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

        <Card className="p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            All Users
          </h2>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading users...</p>
          ) : (
            <UserRetentionTable users={users} />
          )}
        </Card>
      </div>
    </div>
  );
}

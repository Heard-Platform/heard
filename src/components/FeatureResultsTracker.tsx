import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, TrendingUp, Smartphone, UserPlus, Tag } from "lucide-react";
import { api } from "../utils/api";
import type { FeatureResults } from "../types";

interface FeatureResultsTrackerProps {
  onExit: () => void;
}

export function FeatureResultsTracker({ onExit }: FeatureResultsTrackerProps) {
  const [stats, setStats] = useState<FeatureResults | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.getFeatureStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching feature stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="heard-page-bg heard-center p-4">
        <Card className="w-full max-w-md p-8">
          <p className="text-center">Loading feature stats...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="heard-page-bg p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="heard-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl">Feature Results Tracker</h1>
          </div>
          <Button
            variant="outline"
            onClick={onExit}
          >
            <X className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Smartphone className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Phone Verified Users</p>
                <p className="text-3xl font-bold">{stats?.phoneVerifiedUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Non-anonymous users who have verified their phone number
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserPlus className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Converted from Anonymous</p>
                <p className="text-3xl font-bold">{stats?.convertedFromAnonUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who started anonymous and later created an account
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Tag className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Users from Flyers</p>
                <p className="text-3xl font-bold">{stats?.flyerUsers ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who signed up via a QR code flyer
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
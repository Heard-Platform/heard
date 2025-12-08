import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { X, User, BarChart3, MessageSquare } from "lucide-react";
import { api } from "../utils/api";
import type { DebateRoom, SubHeard } from "../types";
import { SparklineChart } from "./SparklineChart";
import { ActivityMetrics } from "./ActivityMetrics";

interface AdminUser {
  userId: string;
  name: string;
  lastSeen: number;
}

interface Feedback {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
  createdAt: string;
}

interface AdminDashboardProps {
  onExit?: () => void;
  currentUserId: string;
}

interface ActivityMetrics {
  dau: number;
  wau: number;
  mau: number;
  dailyBreakdown: Array<{ date: string; activeUsers: number }>;
  calculatedAt: string;
}

interface PublicStats {
  totalUsers: number;
  totalSubHeards: number;
  totalDebates: number;
  usersSparkline: Array<{ day: number; count: number; timestamp: number }>;
  subHeardsSparkline: Array<{ day: number; count: number; timestamp: number }>;
  debatesSparkline: Array<{ day: number; count: number; timestamp: number }>;
}

export function AdminDashboard({ onExit, currentUserId }: AdminDashboardProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [subHeards, setSubHeards] = useState<SubHeard[]>([]);
  const [debates, setDebates] = useState<DebateRoom[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUserId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // First fetch sub-heards to check if user is admin
      const subHeardsRes = await api.getSubHeards(currentUserId);
      
      if (subHeardsRes.success) {
        const allSubHeards = subHeardsRes.data?.subHeards || [];
        setSubHeards(allSubHeards);
        
        // Check if current user is admin of any sub-heard
        const userIsAdmin = allSubHeards.some(sh => sh.adminId === currentUserId);
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Fetch metrics data (these don't require auth)
          const [debatesRes, feedbackRes, activityMetricsRes, publicStatsRes] = await Promise.all([
            api.getActiveRooms(undefined, currentUserId),
            api.getFeedbackList(),
            api.getPublicActivityMetrics(),
            api.getPublicStats(),
          ]);

          if (debatesRes.success) {
            setDebates(debatesRes.data?.rooms || []);
          }
          if (feedbackRes.success) {
            setFeedback(feedbackRes.data?.feedback || []);
          }
          if (activityMetricsRes.success) {
            setActivityMetrics(activityMetricsRes.data || null);
          }
          if (publicStatsRes.success) {
            setPublicStats(publicStatsRes.data || null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <p className="text-center">Loading dashboard...</p>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl">Admin Dashboard</h1>
            {onExit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExit}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-center text-muted-foreground">
            You need to be an admin of a community to access this dashboard.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl">Admin Dashboard</h1>
          </div>
          {onExit && (
            <Button
              variant="outline"
              onClick={onExit}
            >
              <X className="w-4 h-4 mr-2" />
              Exit
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl">{publicStats?.totalUsers ?? 0}</p>
              </div>
            </div>
            <SparklineChart data={publicStats?.usersSparkline ?? []} color="#2563eb" />
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sub-Heards</p>
                <p className="text-2xl">{publicStats?.totalSubHeards ?? 0}</p>
              </div>
            </div>
            <SparklineChart data={publicStats?.subHeardsSparkline ?? []} color="#9333ea" />
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Debates</p>
                <p className="text-2xl">{publicStats?.totalDebates ?? 0}</p>
                <p className="text-xs text-muted-foreground">
                  {debates.filter(d => d.isActive).length} active
                </p>
              </div>
            </div>
            <SparklineChart data={publicStats?.debatesSparkline ?? []} color="#16a34a" />
          </Card>
        </div>

        {/* Activity Metrics Section */}
        {activityMetrics && <ActivityMetrics metrics={activityMetrics} />}

        {/* Feedback Section */}
        <Card className="p-6">
          <h2 className="text-xl mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            User Feedback
          </h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {feedback.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No feedback yet</p>
            ) : (
              feedback.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-purple-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>
                        {item.userId === "anonymous" 
                          ? "Anonymous User" 
                          : item.userId.substring(0, 8)}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap bg-white p-3 rounded border border-purple-100">
                    {item.text}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    ID: {item.id.substring(0, 12)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
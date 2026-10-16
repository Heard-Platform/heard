import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Loader2, User, MessageSquare, ThumbsUp, Flame, Activity, History, ChevronDown, ChevronRight } from "lucide-react";
import { UserTimelineChart } from "./UserTimelineChart";
import { api } from "../../utils/api";
import { UserHistorySession, UserHistoryData, UserTimelineEvent } from "../../types";

interface UserHistoryProps {
  currentUserId: string;
  adminKey: string;
}

const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString();

const formatUserOption = (user: UserHistorySession) => {
  const name = user.nickname || "(no nickname)";
  const contact = user.isAnonymous ? "anonymous" : user.email || "no email";
  return `${name} (${contact}) - Last active: ${formatDate(user.lastActive)}`;
};

export function UserHistory({ currentUserId, adminKey }: UserHistoryProps) {
  const [users, setUsers] = useState<UserHistorySession[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [historyData, setHistoryData] = useState<UserHistoryData | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEventListOpen, setIsEventListOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUserId && currentUserId !== selectedUserId) {
      setSelectedUserId(currentUserId);
      loadUserHistory(currentUserId);
    }
  }, [currentUserId]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setError(null);
    try {
      const response = await api.adminGetUsers(adminKey);
      if (response.success && response.data) {
        // Merged anonymous users show up inside their account's history instead
        setUsers(response.data.users.filter((user) => !user.mergedIntoUserId));
      } else {
        setError("Failed to load users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Error loading users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadUserHistory = async (userId: string) => {
    if (!userId) return;

    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await api.adminGetUserHistory(userId, adminKey);
      if (response.success && response.data) {
        setHistoryData(response.data);
      } else {
        setError("Failed to load user history");
      }
    } catch (err) {
      console.error("Error loading user history:", err);
      setError("Error loading user history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    if (userId) {
      loadUserHistory(userId);
    } else {
      setHistoryData(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base mb-2 block">Select User</Label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading users...
              </div>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {formatUserOption(user)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </Card>

      {isLoadingHistory && (
        <Card className="p-6">
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading user history...
          </div>
        </Card>
      )}

      {historyData && !isLoadingHistory && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg">Timeline</h3>
              <span className="text-sm text-slate-500">
                ({historyData.timeline.length})
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              {historyData.user.id}
              {historyData.anonymousUserIds.length > 0 &&
                ` · merged anonymous ids: ${historyData.anonymousUserIds.join(", ")}`}
            </p>
            {historyData.timeline.length === 0 ? (
              <p className="text-slate-500 text-sm">No events recorded</p>
            ) : (
              <>
                <UserTimelineChart timeline={historyData.timeline} />
                <button
                  type="button"
                  onClick={() => setIsEventListOpen((isOpen) => !isOpen)}
                  className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                >
                  {isEventListOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  {isEventListOpen ? "Hide" : "Show"} event list
                </button>
                {isEventListOpen && (
                  <ol className="max-h-128 overflow-y-auto space-y-2 mt-3">
                    {historyData.timeline.map((entry, index) => (
                      <TimelineRow key={`${entry.kind}-${entry.timestamp}-${index}`} entry={entry} />
                    ))}
                  </ol>
                )}
              </>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg">Rooms Created</h3>
              <span className="text-sm text-slate-500">
                ({historyData.rooms.length})
              </span>
            </div>
            {historyData.rooms.length === 0 ? (
              <p className="text-slate-500 text-sm">No rooms created</p>
            ) : (
              <div className="space-y-3">
                {historyData.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-slate-900 mb-1">{room.topic}</div>
                    <div className="text-sm text-slate-500">
                      Created: {formatDate(room.createdAt)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Status: {room.isActive ? "Active" : "Inactive"}
                    </div>
                    {room.subHeard && (
                      <div className="text-sm text-slate-500">
                        Community: {room.subHeard}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="text-lg">Statements</h3>
              <span className="text-sm text-slate-500">
                ({historyData.statements.length})
              </span>
            </div>
            {historyData.statements.length === 0 ? (
              <p className="text-slate-500 text-sm">No statements posted</p>
            ) : (
              <div className="space-y-3">
                {historyData.statements.map((statement) => (
                  <div
                    key={statement.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-slate-900 mb-1">{statement.text}</div>
                    <div className="text-sm text-slate-500">
                      Posted: {formatDate(statement.timestamp)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Room: {statement.roomId}
                    </div>
                    <div className="text-sm text-slate-500">
                      Agrees: {statement.agrees || 0} | Disagrees:{" "}
                      {statement.disagrees || 0} | Passes: {statement.passes || 0}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg">Votes</h3>
              <span className="text-sm text-slate-500">
                ({historyData.votes.length})
              </span>
            </div>
            {historyData.votes.length === 0 ? (
              <p className="text-slate-500 text-sm">No votes cast</p>
            ) : (
              <div className="space-y-3">
                {historyData.votes.map((vote) => (
                  <div
                    key={vote.id ?? vote.statementId}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-slate-900 mb-1">
                      Voted {vote.voteType}: {vote.statementText ?? vote.statementId}
                    </div>
                    {vote.roomId && (
                      <div className="text-sm text-slate-500">
                        Room: {vote.roomId}
                      </div>
                    )}
                    <div className="text-sm text-slate-500">
                      Voted: {formatDate(vote.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg">Rants</h3>
              <span className="text-sm text-slate-500">
                ({historyData.rants.length})
              </span>
            </div>
            {historyData.rants.length === 0 ? (
              <p className="text-slate-500 text-sm">No rants submitted</p>
            ) : (
              <div className="space-y-3">
                {historyData.rants.map((rant) => (
                  <div
                    key={rant.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-slate-900 mb-1">{rant.text}</div>
                    <div className="text-sm text-slate-500">
                      Submitted: {formatDate(rant.timestamp)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Room: {rant.roomId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg">Active Days</h3>
              <span className="text-sm text-slate-500">
                ({historyData.activities.length})
              </span>
            </div>
            {historyData.activities.length === 0 ? (
              <p className="text-slate-500 text-sm">No activity recorded</p>
            ) : (
              <div className="space-y-3">
                {historyData.activities.map((activity) => (
                  <div
                    key={`${activity.date}-${activity.userId}`}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-slate-900 mb-1">{activity.date}</div>
                    <div className="text-sm text-slate-500">
                      Last seen: {formatDate(activity.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function TimelineRow({ entry }: { entry: UserTimelineEvent }) {
  return (
    <li className="p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 tabular-nums">
          {formatDate(entry.timestamp)}
        </span>
        <span className="text-slate-900">{entry.label}</span>
        {entry.wasAnonymous && <Badge variant="secondary">anonymous</Badge>}
      </div>
      {entry.detail && (
        <div className="text-sm text-slate-700 mt-1 wrap-break-word">{entry.detail}</div>
      )}
      {entry.roomId && (
        <div className="text-xs text-slate-500 mt-1">
          Room: {entry.roomTopic ?? entry.roomId}
        </div>
      )}
    </li>
  );
}

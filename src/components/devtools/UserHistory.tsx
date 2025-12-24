import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Loader2, User, MessageSquare, ThumbsUp, Flame } from "lucide-react";
import { api } from "../../utils/api";

interface UserOption {
  id: string;
  displayName: string;
  email: string;
  lastSeen: number;
}

interface UserHistoryData {
  rooms: any[];
  statements: any[];
  votes: any[];
  rants: any[];
}

interface UserHistoryProps {
  currentUserId: string;
  adminKey: string;
}

export function UserHistory({ currentUserId, adminKey }: UserHistoryProps) {
  const [users, setUsers] = useState<UserOption[]>([]);
  console.log(users, "users");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [historyData, setHistoryData] = useState<UserHistoryData | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    setError(null);
    try {
      const response = await api.adminGetAllUsers(adminKey) as any;
      if (response.success && response.data) {
        const rawUsers = response.data.users || [];
        const mappedUsers = rawUsers.map((user: any) => ({
          id: user.userId,
          displayName: user.name,
          email: user.email,
          lastSeen: user.lastSeen,
        }));

        setUsers(mappedUsers);
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
      const response = await api.adminGetUserHistory(userId, adminKey) as any;
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
    console.log("Selected user ID:", userId);
    setSelectedUserId(userId);
    loadUserHistory(userId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
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
                    {user.displayName} ({user.email}) - Last seen:{" "}
                    {formatDate(user.lastSeen)}
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
                      Posted: {formatDate(statement.createdAt)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Room: {statement.roomId}
                    </div>
                    <div className="text-sm text-slate-500">
                      Agrees: {statement.agreeVotes || 0} | Disagrees:{" "}
                      {statement.disagreeVotes || 0}
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
                {historyData.votes.map((vote, index) => (
                  <div
                    key={`${vote.statementId}-${index}`}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="text-slate-900 mb-1">
                      {vote.voteType === "agree" ? "Agreed" : "Disagreed"} with
                      statement
                    </div>
                    <div className="text-sm text-slate-500">
                      Statement ID: {vote.statementId}
                    </div>
                    <div className="text-sm text-slate-500">
                      Room: {vote.roomId}
                    </div>
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
                      Submitted: {formatDate(rant.createdAt)}
                    </div>
                    <div className="text-sm text-slate-500">
                      Room: {rant.roomId}
                    </div>
                    <div className="text-sm text-slate-500">
                      Status: {rant.processed ? "Processed" : "Pending"}
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
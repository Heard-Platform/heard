import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Users, Clock, RefreshCw, LogIn } from "lucide-react";

interface DebateRoom {
  id: string;
  topic: string;
  phase:
    | "lobby"
    | "initial"
    | "bridge"
    | "crux"
    | "plurality"
    | "voting"
    | "results";
  roundNumber: number;
  phaseStartTime: number;
  participants: string[];
  isActive: boolean;
  createdAt: number;
}

interface ActiveRoomsListProps {
  rooms: DebateRoom[];
  onJoinRoom: (roomId: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const phaseDisplayNames = {
  lobby: "🏛️ Lobby",
  initial: "💭 Initial Thoughts",
  bridge: "🌉 Building Bridges",
  crux: "⚡ Finding Cruxes",
  plurality: "💎 Exploring Pluralities",
  voting: "🗳️ Voting",
  results: "🏆 Results",
};

const phaseColors = {
  lobby: "bg-blue-50 text-blue-700 border-blue-200",
  initial: "bg-purple-50 text-purple-700 border-purple-200",
  bridge: "bg-green-50 text-green-700 border-green-200",
  crux: "bg-orange-50 text-orange-700 border-orange-200",
  plurality: "bg-pink-50 text-pink-700 border-pink-200",
  voting: "bg-yellow-50 text-yellow-700 border-yellow-200",
  results: "bg-gray-50 text-gray-700 border-gray-200",
};

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (minutes < 1) return "Just started";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return "More than a day ago";
}

export function ActiveRoomsList({
  rooms,
  onJoinRoom,
  onRefresh,
  loading = false,
}: ActiveRoomsListProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 10000);

    return () => clearInterval(interval);
  }, [onRefresh]);

  // Filter out rooms that are too old or in results phase, then sort by most recent
  const availableRooms = rooms
    .filter((room) => {
      const hoursSinceCreated =
        (Date.now() - room.createdAt) / (1000 * 60 * 60);
      return room.isActive && hoursSinceCreated < 2; // Only show rooms from last 2 hours
    })
    .sort((a, b) => b.createdAt - a.createdAt); // Most recent first

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>🔥 Active Debate Rooms</h3>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-4 h-4"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-muted rounded-md"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3>🔥 Active Debate Rooms</h3>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={refreshing}
          className="p-2"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <RefreshCw className="w-4 h-4" />
          </motion.div>
        </Button>
      </div>

      {availableRooms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="mb-2">🤔</div>
          <p className="text-sm">No active rooms right now.</p>
          <p className="text-xs mt-1">
            Be the first to start a debate!
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {availableRooms.map((room) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight line-clamp-2">
                      {room.topic}
                    </p>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${phaseColors[room.phase]}`}
                    >
                      {phaseDisplayNames[room.phase]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{room.participants.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatTimeAgo(room.createdAt)}
                        </span>
                      </div>
                      {room.roundNumber > 1 && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1 py-0"
                        >
                          Round {room.roundNumber}
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={() => onJoinRoom(room.id)}
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      Join
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {availableRooms.length > 0 && (
        <div className="mt-4 pt-3 border-t text-xs text-muted-foreground text-center">
          {availableRooms.length} active room
          {availableRooms.length !== 1 ? "s" : ""} •
          Auto-refreshing
        </div>
      )}
    </Card>
  );
}
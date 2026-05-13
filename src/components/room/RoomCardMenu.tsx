// @ts-ignore
import { toast } from "sonner@2.0.3";

import { Button } from "../ui/button";
import {
  Users,
  XCircle,
  Link2,
  MoreHorizontal,
  GitMerge,
  BarChart2,
  Pause,
  Play,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { createShareableLink } from "../../utils/url";
import { share } from "../../utils/share";
import { DebateRoom } from "../../types";
import { useDebateSession } from "../../hooks/useDebateSession";

interface RoomCardMenuProps {
  room: DebateRoom;
  participantCount: number;
  isRealtime: boolean;
  hasRealtimeEnded: boolean | number | undefined;
  isDeveloper: boolean;
  isHost: boolean;
  onOpenDeduplication: () => void;
  onOpenVoteMatrix: () => void;
  onOpenEditRoom: () => void;
}

export function RoomCardMenu({
  room,
  participantCount,
  isRealtime,
  hasRealtimeEnded,
  isDeveloper,
  isHost,
  onOpenDeduplication,
  onOpenVoteMatrix,
  onOpenEditRoom,
}: RoomCardMenuProps) {
  const { setRoomInactive, setResponsesPaused } = useDebateSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-0 flex-shrink-0"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async (e: React.MouseEvent) => {
            e.stopPropagation();
            const link = createShareableLink(room.id);
            await share({
              url: link,
              title: "Join this conversation on Heard",
              text: "Check out this conversation!",
              onSuccess: () => {
                toast.success("Link copied to clipboard!");
              },
              onError: (error) => {
                toast.error("Failed to share link");
                console.error("Share error:", error);
              },
            });
          }}
        >
          <Link2 className="w-4 h-4 mr-2" />
          Share Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Users className="w-4 h-4 mr-2" />
          {participantCount} {participantCount === 1 ? 'person' : 'people'}
        </DropdownMenuItem>
        {isRealtime && room.endTime && !hasRealtimeEnded && (
          <DropdownMenuItem disabled>
            {(() => {
              const timeLeft = Math.max(
                0,
                room.endTime - Date.now(),
              );
              const days = Math.floor(
                timeLeft / (24 * 60 * 60 * 1000),
              );
              const hours = Math.floor(
                (timeLeft % (24 * 60 * 60 * 1000)) /
                  (60 * 60 * 1000),
              );
              const minutes = Math.floor(
                (timeLeft % (60 * 60 * 1000)) / 60000,
              );
              const seconds = Math.floor(
                (timeLeft % 60000) / 1000,
              );

              if (days > 0) {
                return `${days}d left`;
              } else if (hours > 0) {
                return `${hours}h left`;
              } else if (minutes > 0) {
                return `${minutes}m left`;
              } else {
                return `${seconds}s left`;
              }
            })()}
          </DropdownMenuItem>
        )}
        {(isHost || isDeveloper) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
              Moderator Tools
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenDeduplication();
              }}
            >
              <GitMerge className="w-4 h-4 mr-2" />
              Hide and Merge Statements
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenVoteMatrix();
              }}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              View Vote Matrix
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                const isPaused = !!room.responsesPaused;
                if (!isPaused && !window.confirm(
                  "No one will be able to add new responses until you resume. Voting continues as normal.",
                )) return;
                const response = await setResponsesPaused(room.id, !isPaused);
                if (response?.success) {
                  toast.success(isPaused ? "Responses resumed" : "Responses paused");
                } else {
                  toast.error(isPaused ? "Failed to resume responses" : "Failed to pause responses");
                }
              }}
            >
              {room.responsesPaused ? (
                <Play className="w-4 h-4 mr-2" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              {room.responsesPaused ? "Resume responses" : "Pause responses"}
            </DropdownMenuItem>
          </>
        )}
        {isDeveloper && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenEditRoom();
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit post
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                await setRoomInactive(room.id);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Deactivate
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
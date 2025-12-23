// @ts-ignore
import { toast } from "sonner@2.0.3";

import { Button } from "../ui/button";
import {
  Users,
  XCircle,
  BarChart3,
  Link2,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { createShareableLink } from "../../utils/url";
import { share } from "../../utils/share";
import { DebateRoom } from "../../types";

interface RoomCardMenuProps {
  room: DebateRoom;
  participantCount: number;
  isRealtime: boolean;
  hasRealtimeEnded: boolean | number | undefined;
  isDeveloper: boolean;
  handleOpenAnalysis: () => void;
  onSetInactive?: () => Promise<boolean>;
}

export function RoomCardMenu({
  room,
  participantCount,
  isRealtime,
  hasRealtimeEnded,
  isDeveloper,
  onSetInactive,
  handleOpenAnalysis,
}: RoomCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-0 flex-shrink-0"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <Menu className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleOpenAnalysis();
          }}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Analysis
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async (e: React.MouseEvent) => {
            e.stopPropagation();
            const link = createShareableLink(room.id);
            await share({
              url: link,
              title: "Join this debate on Heard",
              text: "Check out this debate!",
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
          {participantCount} {participantCount === 1 ? 'player' : 'players'}
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
        {isDeveloper && onSetInactive && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                await onSetInactive();
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
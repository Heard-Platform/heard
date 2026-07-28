// @ts-ignore
import { toast } from "sonner@2.0.3";

import { Button } from "../ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  UserPlus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { createShareableLink, createCohostInviteLink } from "../../utils/url";
import { share } from "../../utils/share";
import { DebateRoom } from "../../types";
import { useDebateSession } from "../../hooks/useDebateSession";
import { timeAgoShort } from "../../utils/time";

interface RoomCardMenuProps {
  room: DebateRoom;
  participantCount: number;
  isRealtime: boolean;
  hasRealtimeEnded: boolean | number | undefined;
  isDeveloper: boolean;
  isHost: boolean;
  isTrueHost: boolean;
  isCompleted: boolean;
  onOpenEditRoom: () => void;
  onOpenDeduplication: () => void;
  onOpenVoteMatrix: () => void;
}

export function RoomCardMenu({
  room,
  participantCount,
  isRealtime,
  hasRealtimeEnded,
  isDeveloper,
  isHost,
  isTrueHost,
  isCompleted,
  onOpenEditRoom,
  onOpenDeduplication,
  onOpenVoteMatrix,
}: RoomCardMenuProps) {
  const { t } = useTranslation(["room", "toast"]);
  const { setRoomInactive, setResponsesPaused, createCohostInvite, clearRoomCohosts } = useDebateSession();
  const [cohostCount, setCohostCount] = useState(room.cohostIds?.length ?? 0);
  const [isClearingCohosts, setIsClearingCohosts] = useState(false);

  const handleInviteCohost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const response = await createCohostInvite(room.id);
    if (!response?.success || !response.data) {
      toast.error(t("toast:inviteLinkFailed"));
      return;
    }
    const link = createCohostInviteLink(room.id, response.data.token);
    await share({
      url: link,
      title: t("cohostInviteTitle"),
      text: t("cohostInviteText"),
      onSuccess: () => {
        toast.success(t("toast:cohostInviteCopied"));
      },
      onError: (error) => {
        toast.error(t("toast:shareInviteLinkFailed"));
        console.error("Share error:", error);
      },
    });
  };

  const handleClearCohosts = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsClearingCohosts(true);
    try {
      const response = await clearRoomCohosts(room.id);
      if (response?.success) {
        toast.success(t("toast:allCohostsRemoved"));
        setCohostCount(0);
      } else {
        toast.error(t("toast:removeCohostsFailed"));
      }
    } finally {
      setIsClearingCohosts(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="heard-pill hover:bg-secondary/60 w-9 h-9"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>
          <span className="text-xs text-muted-foreground">
            {t("rcmAgo", { time: timeAgoShort(room.createdAt) })}
            {room.endTime && !isCompleted && (() => {
              const timeLeft = Math.max(0, room.endTime - Date.now());
              const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
              const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
              const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / 60000);
              const label = days > 0 ? `${days}d` : hours > 0 ? `${hours}h` : `${minutes}m`;
              return t("rcmLeftSuffix", { label });
            })()}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async (e: React.MouseEvent) => {
            e.stopPropagation();
            const link = createShareableLink(room.id);
            await share({
              url: link,
              title: t("joinConvoTitle"),
              text: t("joinConvoText"),
              onSuccess: () => {
                toast.success(t("toast:linkCopied"));
              },
              onError: (error) => {
                toast.error(t("toast:shareLinkFailed"));
                console.error("Share error:", error);
              },
            });
          }}
        >
          <Link2 className="w-4 h-4 mr-2" />
          {t("rcmShareLink")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Users className="w-4 h-4 mr-2" />
          {t("rcmParticipants", { count: participantCount })}
        </DropdownMenuItem>
        {(isHost || isDeveloper) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
              {t("rcmHostTools")}
            </DropdownMenuLabel>
            {isTrueHost && (
              <>
                <DropdownMenuItem onClick={handleInviteCohost}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("rcmInviteCohost")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleClearCohosts}
                  disabled={isClearingCohosts || cohostCount === 0}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isClearingCohosts ? t("rcmRemoving") : t("rcmRemoveCohosts", { count: cohostCount })}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenDeduplication();
              }}
            >
              <GitMerge className="w-4 h-4 mr-2" />
              {t("rcmHideMerge")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenVoteMatrix();
              }}
            >
              <BarChart2 className="w-4 h-4 mr-2" />
              {t("rcmVoteMatrix")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                const isPaused = !!room.responsesPaused;
                if (!isPaused && !window.confirm(t("rcmPauseConfirm"))) return;
                const response = await setResponsesPaused(room.id, !isPaused);
                if (response?.success) {
                  toast.success(isPaused ? t("toast:responsesResumed") : t("toast:responsesPaused"));
                } else {
                  toast.error(isPaused ? t("toast:resumeResponsesFailed") : t("toast:pauseResponsesFailed"));
                }
              }}
            >
              {room.responsesPaused ? (
                <Play className="w-4 h-4 mr-2" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              {room.responsesPaused ? t("rcmResumeResponses") : t("rcmPauseResponses")}
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
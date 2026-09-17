// @ts-ignore
import { toast } from "sonner@2.0.3";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Button } from "../../ui/button";
import { DebateLengthPicker } from "../../widgets/DebateLengthPicker";
import { api } from "../../../utils/api";
import { useDebateSession } from "../../../hooks/useDebateSession";
import { DebateRoom } from "../../../types";

interface RestartRoomModalProps {
  room: DebateRoom;
  onClose: () => void;
}

export function RestartRoomModal({ room, onClose }: RestartRoomModalProps) {
  const { restartRoom } = useDebateSession();

  const [debateLength, setDebateLength] = useState<number>(60);
  const [isSaving, setIsSaving] = useState(false);

  const handleRestart = async () => {
    setIsSaving(true);
    const response = await restartRoom(room.id, Date.now() + debateLength * 60000);
    setIsSaving(false);

    if (response?.success) {
      api.trackEvent("room_restarted", room.id);
      toast.success("Room restarted");
      onClose();
    } else {
      toast.error(response?.error || "Failed to restart room");
    }
  };

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Restart room</DialogTitle>
          <DialogDescription>
            This conversation ended. Choose how long the new round should run
            before it closes again.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <DebateLengthPicker
            debateLength={debateLength}
            onDebateLengthChange={setDebateLength}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleRestart} disabled={isSaving}>
            {isSaving ? "Restarting..." : "Restart room"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

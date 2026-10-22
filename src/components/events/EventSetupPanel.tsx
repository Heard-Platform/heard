// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useState } from "react";
import { Check, Copy, Radio } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { EventPostList } from "./EventPostList";
import type { LiveEventStatus, EventSetupRoom } from "../../types";

const COPIED_RESET_MS = 2000;

const STATUS_COPY: Record<LiveEventStatus, string> = {
  setup: "Put the posts in the order you'll run them.",
  live: "Live now. The order is locked until the session ends.",
  ended: "This session has ended.",
};

export interface EventSetupPanelProps {
  rooms: EventSetupRoom[];
  status: LiveEventStatus;
  currentIndex: number | null;
  joinUrl: string;
  displayUrl: string;
  onReorder: (roomOrder: string[]) => void;
  onOpenDisplay: () => void;
}

export function EventSetupPanel({
  rooms,
  status,
  currentIndex,
  joinUrl,
  displayUrl,
  onReorder,
  onOpenDisplay,
}: EventSetupPanelProps) {
  const hasRooms = rooms.length > 0;

  return (
    <Card className="heard-card-bg overflow-hidden">
      <div className="p-5 space-y-4">
        <div className="space-y-0.5">
          <h3 className="font-bold text-foreground flex items-center gap-1.5">
            <Radio className="w-4 h-4" /> Live session
          </h3>
          <p className="text-sm text-muted-foreground">
            {hasRooms ? STATUS_COPY[status] : "Add posts to this event to run it live."}
          </p>
        </div>

        {hasRooms && (
          <EventPostList
            rooms={rooms}
            currentIndex={status === "live" ? currentIndex : null}
            currentBadge="Live"
            onReorder={status === "setup" ? onReorder : undefined}
          />
        )}

        <div className="space-y-1.5">
          <CopyLinkRow label="Join link" url={joinUrl} />
          <CopyLinkRow label="Display link" url={displayUrl} />
        </div>

        <Button
          className="w-full"
          disabled={!hasRooms}
          onClick={onOpenDisplay}
        >
          Open display
        </Button>
      </div>
    </Card>
  );
}

function CopyLinkRow({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (error) {
      toast.error(`Couldn't copy the ${label.toLowerCase()}`);
      console.error("Copy error:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{url}</p>
      </div>
      <Button variant="outline" size="sm" onClick={handleCopy} aria-label={`Copy ${label.toLowerCase()}`}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

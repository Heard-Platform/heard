import { ExternalLink } from "lucide-react";
import type { EventInvite } from "../../types";
import { Button } from "../ui/button";

interface EventInviteCardProps {
  invite: EventInvite;
  onGoToEvent: () => void;
  onKeepVoting: () => void;
}

export function EventInviteCard({
  invite,
  onGoToEvent,
  onKeepVoting,
}: EventInviteCardProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold leading-tight tracking-tight dark-text">
          {invite.headline}
        </h2>
        <p className="text-sm leading-snug secondary-text">
          {invite.details}
        </p>
      </div>

      <img
        src={invite.imageUrl}
        alt=""
        className="w-full rounded-lg"
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="lg"
          className="h-11 font-bold"
          onClick={onKeepVoting}
        >
          Keep voting
        </Button>
        <Button asChild size="lg" className="h-11 font-bold">
          <a
            href={invite.registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onGoToEvent}
          >
            Go to event
            <ExternalLink className="size-4" aria-hidden />
          </a>
        </Button>
      </div>
    </div>
  );
}

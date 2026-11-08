import type { EventInvite } from "../../types";
import { EventInviteCard } from "./EventInviteCard";

const GEORGETOWN_EVENT_INVITE: EventInvite = {
  headline:
    "Want to continue this conversation at a university-sponsored event?",
  details: "Thursday, November 12, on campus.",
  imageUrl:
    "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/peace-panel-event.jpeg",
  registrationUrl: "http://tinyurl.com/Nov12-SHIFT",
};

interface GeorgetownEventCardProps {
  onGoToEvent: () => void;
  onKeepVoting: () => void;
}

export function GeorgetownEventCard({
  onGoToEvent,
  onKeepVoting,
}: GeorgetownEventCardProps) {
  return (
    <EventInviteCard
      invite={GEORGETOWN_EVENT_INVITE}
      onGoToEvent={onGoToEvent}
      onKeepVoting={onKeepVoting}
    />
  );
}

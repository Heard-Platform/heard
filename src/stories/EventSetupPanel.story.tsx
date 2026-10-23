import { useState } from "react";
import { EventSetupPanel } from "../components/events/EventSetupPanel";
import { orderByRoomOrder } from "../utils/live-event";
import type { LiveEventStatus, EventSetupRoom } from "../types";
import { StoryContainer } from "./StoryContainer";

const JOIN_URL = "https://heard.vote/prgn";
const DISPLAY_URL = "https://heard.vote/event/4/display?key=3f9c2a7be1d84f06a5c0e29d7b41c8aa";
const SUPPORT_VIEW_URL = "https://heard.vote/event/4/support?key=3f9c2a7be1d84f06a5c0e29d7b41c8aa";

const PRGN_ROOMS: EventSetupRoom[] = [
  { id: "housing", topic: "Housing near transit", emoji: "🏘️" },
  { id: "bike-lanes", topic: "Protected bike lanes on Main Street", emoji: "🚲" },
  { id: "library-hours", topic: "Longer library hours", emoji: "📚" },
  { id: "parking", topic: "Paid parking downtown", emoji: undefined },
  { id: "budget", topic: "What the city should fund first next year, and what can wait", emoji: "💰" },
];

interface EventSetupDemoProps {
  rooms: EventSetupRoom[];
  status: LiveEventStatus;
  currentIndex: number | null;
}

function EventSetupDemo({ rooms, status, currentIndex }: EventSetupDemoProps) {
  const [roomOrder, setRoomOrder] = useState(rooms.map((room) => room.id));

  const handleReorder = (nextOrder: string[]) => {
    console.log("[Story] reorder", nextOrder);
    setRoomOrder(nextOrder);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <EventSetupPanel
        rooms={orderByRoomOrder(rooms, roomOrder)}
        status={status}
        currentIndex={currentIndex}
        joinUrl={JOIN_URL}
        displayUrl={DISPLAY_URL}
        supportViewUrl={SUPPORT_VIEW_URL}
        onReorder={handleReorder}
        onOpenDisplay={() => console.log("[Story] open display")}
        onOpenSupportView={() => console.log("[Story] open support view")}
      />
    </div>
  );
}

export function EventSetupPanelStory() {
  return (
    <StoryContainer
      title="Event Setup Panel"
      description="Moderator-only panel on the event page. Order the posts with the arrows, copy the join and display links, open the display (which runs the session). Ordering locks once the session starts."
      variants={[
        {
          id: "ordered",
          label: "Ordered",
          children: <EventSetupDemo rooms={PRGN_ROOMS} status="setup" currentIndex={null} />,
        },
        {
          id: "live",
          label: "Live",
          children: <EventSetupDemo rooms={PRGN_ROOMS} status="live" currentIndex={2} />,
        },
        {
          id: "ended",
          label: "Ended",
          children: <EventSetupDemo rooms={PRGN_ROOMS} status="ended" currentIndex={4} />,
        },
        {
          id: "no-posts",
          label: "No posts",
          children: <EventSetupDemo rooms={[]} status="setup" currentIndex={null} />,
        },
      ]}
    />
  );
}

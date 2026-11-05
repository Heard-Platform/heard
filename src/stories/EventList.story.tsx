import { EventList } from "../components/community/EventList";
import type { EventSummary } from "../types";
import { StoryContainer } from "./StoryContainer";

const COMMUNITY_EVENTS: EventSummary[] = [
  {
    id: "1",
    name: "Town hall on the budget surplus",
    subtitle: "Thursday, 7pm in the library",
    communityName: "springfield",
  },
  {
    id: "2",
    name: "Neighborhood safety night",
    communityName: "springfield",
  },
  {
    id: "3",
    name: "Open forum on remote and in-office work for everyone on staff",
    subtitle:
      "A long name and subtitle that run past the edge of the dialog",
    communityName: "springfield",
  },
  {
    id: "4",
    name: "Parks and recreation listening session",
    communityName: "springfield",
  },
  {
    id: "5",
    name: "School board candidates forum",
    subtitle: "Gym, doors at 6:30",
    communityName: "springfield",
  },
];

const logOpenEvent = (eventId: string) =>
  console.log("[Story] open event", eventId);

export function EventListStory() {
  return (
    <StoryContainer
      title="Event List"
      description="The community's events, listed in the community management dialog under Start an Event. Tapping one closes the dialog and opens the event page. Events no longer show in the feed. Long names and subtitles cut off with an ellipsis. Past about four events, the list scrolls. With no events, nothing shows."
      variants={[
        {
          id: "events",
          label: "Events",
          children: (
            <div className="max-w-md">
              <EventList
                events={COMMUNITY_EVENTS}
                onOpenEvent={logOpenEvent}
              />
            </div>
          ),
        },
      ]}
    />
  );
}

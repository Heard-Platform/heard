import { StoryContainer } from "./StoryContainer";
import { EventTimelineTab } from "../components/activity/event-timeline/EventTimelineTab";
import { buildMockRecentEvents } from "../components/activity/event-timeline/eventTimelineMockData";

const now = Date.now();

export function EventTimelineTabStory() {
  return (
    <StoryContainer
      title="Event Timeline"
      description="Activity dashboard tab: count of every user event type per day over the last week, with a filterable table linking to each user's history"
      variants={[
        {
          id: "typical-week",
          label: "Typical week",
          children: <EventTimelineTab events={buildMockRecentEvents(now)} now={now} />,
        },
        {
          id: "empty",
          label: "No events",
          children: <EventTimelineTab events={[]} now={now} />,
        },
      ]}
    />
  );
}

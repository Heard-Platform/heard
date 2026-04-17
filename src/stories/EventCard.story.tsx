import { EventCard } from "../components/events/EventCard";
import { StoryContainer } from "./StoryContainer";

export function EventCardStory() {
  return (
    <StoryContainer
      title="Event Card"
      description="Feed card for an event"
      variants={[
        {
          id: "with-subtitle",
          label: "With subtitle",
          children: <EventCard event={{ id: "book-club", name: "Adams Morgan Book Club", subtitle: "April meetup" }} />,
        },
        {
          id: "no-subtitle",
          label: "No subtitle",
          children: <EventCard event={{ id: "trivia", name: "Trivia Night" }} />,
        },
      ]}
    />
  );
}

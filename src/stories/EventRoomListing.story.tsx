import {
  EventRoomListing,
  type EventRoomListingProps,
} from "../components/events/EventRoomListing";

const DEMO_PROPS: EventRoomListingProps = {
  eventName: "Adams Morgan Book Club",
  eventSubtitle: "April meetup",
  totalMembers: 12,
  rooms: [
    {
      id: "when-to-meet",
      topic: "When to meet",
      emoji: "🗓️",
      status: "needs_input",
      userHasVoted: false,
      participantCount: 7,
      totalMembers: 12,
      participantAvatars: ["monkey", "panda", "koala", "elephant"],
      onCtaClick: () => {},
    },
    {
      id: "which-book",
      topic: "Which book",
      emoji: "📚",
      status: "needs_input",
      userHasVoted: true,
      newStatementCount: 3,
      participantCount: 9,
      totalMembers: 12,
      participantAvatars: ["rhino", "sloth", "panda", "koala"],
      onCtaClick: () => {},
    },
    {
      id: "where-to-meet",
      topic: "Where to meet",
      emoji: "📍",
      status: "caught_up",
      userHasVoted: true,
      participantCount: 11,
      totalMembers: 12,
      participantAvatars: ["elephant", "monkey", "panda"],
    },
  ],
};

export function EventRoomListingStory() {
  return <EventRoomListing {...DEMO_PROPS} />;
}

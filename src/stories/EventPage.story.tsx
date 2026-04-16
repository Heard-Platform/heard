import {
  EventPage,
  type EventPageProps,
} from "../components/events/EventPage";
import { StoryContainer } from "./StoryContainer";

const BASE_EVENT: EventPageProps["event"] = {
  id: "adams-morgan-book-club",
  name: "Adams Morgan Book Club",
  subtitle: "April meetup",
  totalMembers: 12,
  rooms: [],
};

const WITH_POSTS_PROPS: EventPageProps = {
  event: {
    ...BASE_EVENT,
    rooms: [
      {
        id: "when-to-meet",
        topic: "When to meet",
        emoji: "🗓️",
        participants: ["1", "2", "3", "4"],
        status: "needs_input",
        userHasVoted: false,
        newStatementCount: 4,
        participantAvatars: ["monkey", "panda", "koala", "elephant"],
      },
      {
        id: "which-book",
        topic: "Which book",
        emoji: "📚",
        participants: ["1", "2", "3", "4"],
        status: "needs_input",
        userHasVoted: true,
        newStatementCount: 3,
        participantAvatars: ["rhino", "sloth", "panda", "koala"],
      },
      {
        id: "where-to-meet",
        topic: "Where to meet",
        emoji: "📍",
        participants: ["1", "2", "3"],
        status: "caught_up",
        userHasVoted: true,
        newStatementCount: 0,
        participantAvatars: ["elephant", "monkey", "panda"],
      },
    ],
  },
  onAddRoom: () => console.log("add room"),
  onOpenRoom: (id) => console.log("open room", id),
};

const EMPTY_PROPS: EventPageProps = {
  event: BASE_EVENT,
  onAddRoom: () => console.log("add room"),
  onOpenRoom: (id) => console.log("open room", id),
};

export function Story() {
  return (
    <StoryContainer
      title="Event Page"
      description="Full event view with room listings"
      variants={[
        {
          id: "with-posts",
          label: "With posts",
          children: <EventPage {...WITH_POSTS_PROPS} />,
        },
        {
          id: "empty",
          label: "Empty",
          children: <EventPage {...EMPTY_PROPS} />,
        },
      ]}
    />
  );
}

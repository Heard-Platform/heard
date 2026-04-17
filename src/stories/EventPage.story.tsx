import {
  EventPage,
  type EventPageProps,
} from "../components/events/EventPage";
import { StoryContainer } from "./StoryContainer";

const now = Date.now();

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
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        endTime: now + 5 * 24 * 60 * 60 * 1000,
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
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        endTime: now + 18 * 60 * 60 * 1000,
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
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        endTime: now + 2 * 24 * 60 * 60 * 1000,
      },
      {
        id: "snacks",
        topic: "What snacks to bring",
        emoji: "🍿",
        participants: ["1", "2", "3", "4"],
        status: "completed",
        userHasVoted: true,
        newStatementCount: 0,
        participantAvatars: ["koala", "sloth", "rhino", "monkey"],
        createdAt: now - 14 * 24 * 60 * 60 * 1000,
        endTime: now - 2 * 24 * 60 * 60 * 1000,
      },
    ],
  },
  onAddRoom: () => console.log("add room"),
  onOpenRoom: (id) => console.log("open room", id),
};

const URGENCY_PROPS: EventPageProps = {
  event: {
    ...BASE_EVENT,
    rooms: [
      {
        id: "urgency-critical",
        topic: "Last call: host volunteer",
        emoji: "🙋",
        participants: ["1", "2", "3"],
        status: "needs_input",
        userHasVoted: false,
        newStatementCount: 3,
        participantAvatars: ["panda", "koala", "sloth"],
        createdAt: now - 11 * 24 * 60 * 60 * 1000,
        endTime: now + 30 * 1000,
      },
      {
        id: "urgency-high",
        topic: "Final venue vote",
        emoji: "📍",
        participants: ["1", "2", "3"],
        status: "needs_input",
        userHasVoted: false,
        newStatementCount: 5,
        participantAvatars: ["monkey", "rhino", "panda"],
        createdAt: now - 8 * 24 * 60 * 60 * 1000,
        endTime: now + 20 * 60 * 1000,
      },
      {
        id: "urgency-medium",
        topic: "Meeting format",
        emoji: "🎙️",
        participants: ["1", "2", "3", "4"],
        status: "needs_input",
        userHasVoted: false,
        newStatementCount: 2,
        participantAvatars: ["rhino", "elephant", "monkey", "panda"],
        createdAt: now - 6 * 24 * 60 * 60 * 1000,
        endTime: now + 10 * 60 * 60 * 1000,
      },
      {
        id: "urgency-low",
        topic: "Best chapter of the book",
        emoji: "📖",
        participants: ["1", "2", "3"],
        status: "needs_input",
        userHasVoted: false,
        newStatementCount: 2,
        participantAvatars: ["monkey", "panda", "koala"],
        createdAt: now - 1 * 24 * 60 * 60 * 1000,
        endTime: now + 7 * 24 * 60 * 60 * 1000,
      },
    ],
  },
  onAddRoom: () => console.log("add room"),
  onOpenRoom: (id) => console.log("open room", id),
};

const MISSING_EMOJI_PROPS: EventPageProps = {
  event: {
    ...BASE_EVENT,
    rooms: [
      {
        id: "no-emoji",
        topic: "Room without an emoji",
        emoji: undefined,
        participants: ["1", "2", "3"],
        status: "needs_input",
        userHasVoted: false,
        newStatementCount: 2,
        participantAvatars: ["monkey", "panda", "koala"],
        createdAt: now - 1 * 24 * 60 * 60 * 1000,
        endTime: now + 5 * 24 * 60 * 60 * 1000,
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
          id: "urgency",
          label: "Urgency",
          children: <EventPage {...URGENCY_PROPS} />,
        },
        {
          id: "missing-emoji",
          label: "Missing emoji",
          children: <EventPage {...MISSING_EMOJI_PROPS} />,
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

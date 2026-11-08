import { GeorgetownEventCard } from "../components/room/GeorgetownEventCard";
import { PhoneFrame } from "./PhoneFrame";
import { StoryContainer } from "./StoryContainer";

const logGoToEvent = () => console.log("[Story] go to event");
const logKeepVoting = () => console.log("[Story] keep voting");

export function GeorgetownEventCardStory() {
  return (
    <StoryContainer
      title="Georgetown Event Card"
      description="The event invite card with Georgetown's 11/12 event hardcoded in. The fourth card a flyer scanner sees, after their 3 votes and outside the progress bar. It can't be swiped. A question, the event's details, the event's image, then two ways forward side by side. Go to event opens registration in a new tab and leaves this tab where it is, so it still looks familiar if they come back. Keep voting moves on to the demographic questions."
      variants={[
        {
          id: "in-deck",
          label: "In the deck",
          description:
            "The card in its deck shell on a short phone. Checks that the image keeps the card's side padding and isn't cropped, both buttons fit without scrolling, and Go to event opens the link in a new tab. Taps log to the console.",
          children: (
            <PhoneFrame>
              <div className="p-5">
                <div className="normal-bg rounded-xl border-2 p-5 shadow-xl">
                  <GeorgetownEventCard
                    onGoToEvent={logGoToEvent}
                    onKeepVoting={logKeepVoting}
                  />
                </div>
              </div>
            </PhoneFrame>
          ),
        },
      ]}
    />
  );
}

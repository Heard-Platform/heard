import { EventInviteCard } from "../components/room/EventInviteCard";
import type { EventInvite } from "../types";
import { PhoneFrame } from "./PhoneFrame";
import { StoryContainer } from "./StoryContainer";

const CAMPUS_EVENT_INVITE: EventInvite = {
  headline:
    "Want to continue this conversation at a university-sponsored event?",
  details: "Thursday, November 12, on campus.",
  imageUrl:
    "https://jzwmuyflifxsuclhphux.supabase.co/storage/v1/object/public/public-hosting/peace-panel-event.jpeg",
  registrationUrl: "http://tinyurl.com/Nov12-SHIFT",
};

const logGoToEvent = () => console.log("[Story] go to event");
const logKeepVoting = () => console.log("[Story] keep voting");

export function EventInviteCardStory() {
  return (
    <StoryContainer
      title="Event Invite Card"
      description="The fourth card a flyer scanner sees, after their 3 votes and outside the progress bar. It can't be swiped. A question, the event's details, the event's image, then two ways forward side by side. Go to event opens registration in a new tab and leaves this tab where it is, so it still looks familiar if they come back. Keep voting moves on to the demographic questions."
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
                  <EventInviteCard
                    invite={CAMPUS_EVENT_INVITE}
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

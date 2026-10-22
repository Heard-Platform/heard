import { useState, type FormEvent } from "react";
import { pluralizePerson } from "../../../utils/text";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { AttendeeFrame, AttendeeMessage } from "./AttendeeFrame";

const STATEMENT_MAX_LENGTH = 500;

type EventLobbyProps =
  | { moment: "starting"; peopleHere: number }
  | { moment: "paused" }
  | { moment: "ended" }
  | {
      moment: "waiting";
      peopleHere: number;
      finishedCurrentPost: number;
      onAddStatement: (text: string) => Promise<boolean>;
    };

export function EventLobby(props: EventLobbyProps) {
  return (
    <AttendeeFrame>
      {props.moment === "starting" && (
        <div className="my-auto">
          <AttendeeMessage
            title="You're in."
            body="The event starts soon. Questions will appear here."
            chip={`${props.peopleHere} ${pluralizePerson(props.peopleHere)} here`}
          />
        </div>
      )}
      {props.moment === "paused" && (
        <div className="my-auto">
          <AttendeeMessage title="Voting paused" body="Waiting on the moderator." />
        </div>
      )}
      {props.moment === "ended" && (
        <div className="my-auto">
          <AttendeeMessage title="Thanks for weighing in." body="That's the end of the event." />
        </div>
      )}
      {props.moment === "waiting" && (
        <WaitingForOthers
          peopleHere={props.peopleHere}
          finishedCurrentPost={props.finishedCurrentPost}
          onAddStatement={props.onAddStatement}
        />
      )}
    </AttendeeFrame>
  );
}

interface WaitingForOthersProps {
  peopleHere: number;
  finishedCurrentPost: number;
  onAddStatement: (text: string) => Promise<boolean>;
}

function WaitingForOthers({ peopleHere, finishedCurrentPost, onAddStatement }: WaitingForOthersProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmed = text.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    setIsSubmitting(true);
    const isAdded = await onAddStatement(trimmed);
    setIsSubmitting(false);
    if (isAdded) setText("");
  };

  return (
    <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="mt-4">
        <AttendeeMessage
          title="Waiting for the others"
          chip={`${finishedCurrentPost} of ${peopleHere} done`}
          body="While you wait: what did we miss? The room votes on it."
        />
      </div>

      <Textarea
        className="heard-card-bg mt-6 min-h-24 rounded-xl text-base md:text-base"
        placeholder="Write a statement"
        maxLength={STATEMENT_MAX_LENGTH}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="mt-auto pt-4">
        <Button type="submit" size="lg" className="w-full" disabled={!trimmed || isSubmitting}>
          {isSubmitting ? "Adding…" : "Add statement"}
        </Button>
      </div>
    </form>
  );
}

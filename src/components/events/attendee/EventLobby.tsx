import { useState, type FormEvent } from "react";
import { pluralizePerson } from "../../../utils/text";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { AttendeeFrame, AttendeeMessage } from "./AttendeeFrame";

const STATEMENT_MAX_LENGTH = 500;

type EventLobbyProps =
  | { moment: "starting"; peopleHere: number }
  | { moment: "paused" }
  | {
      moment: "waiting";
      peopleHere: number;
      finishedCurrentPost: number;
      onAddStatement: (text: string) => Promise<void>;
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
  onAddStatement: (text: string) => Promise<void>;
}

function WaitingForOthers({ peopleHere, finishedCurrentPost, onAddStatement }: WaitingForOthersProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  const trimmed = text.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      await onAddStatement(trimmed);
      setText("");
      setAddedCount((count) => count + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
      <div className="mt-4">
        <AttendeeMessage
          title="Waiting for the others"
          chip={`${finishedCurrentPost} of ${peopleHere} done`}
          body={
            addedCount > 0
              ? "Added. The room votes on it. Got another?"
              : "While you wait: what did we miss? The room votes on it."
          }
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

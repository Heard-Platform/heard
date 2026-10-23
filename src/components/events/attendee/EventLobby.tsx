import { useState, type FormEvent } from "react";
import { pluralizePerson, pluralizeStatement } from "../../../utils/text";
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
      statementText: string;
      newStatementCount: number;
      onStatementTextChange: (text: string) => void;
      onAddStatement: (text: string) => Promise<boolean>;
      onVoteOnNewStatements: () => void;
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
        <WaitingForOthers {...props} />
      )}
    </AttendeeFrame>
  );
}

type WaitingForOthersProps = Omit<
  Extract<EventLobbyProps, { moment: "waiting" }>,
  "moment"
>;

function WaitingForOthers({
  peopleHere,
  finishedCurrentPost,
  statementText,
  newStatementCount,
  onStatementTextChange,
  onAddStatement,
  onVoteOnNewStatements,
}: WaitingForOthersProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedStatementText = statementText.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedStatementText) return;
    setIsSubmitting(true);
    await onAddStatement(trimmedStatementText);
    setIsSubmitting(false);
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
        value={statementText}
        onChange={(event) =>
          onStatementTextChange(event.target.value)
        }
      />

      {newStatementCount > 0 && (
        <NewStatementsNote
          newStatementCount={newStatementCount}
          onVoteOnNewStatements={onVoteOnNewStatements}
        />
      )}

      <div className="mt-auto pt-4">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!trimmedStatementText || isSubmitting}
        >
          {isSubmitting ? "Adding…" : "Add statement"}
        </Button>
      </div>
    </form>
  );
}

interface NewStatementsNoteProps {
  newStatementCount: number;
  onVoteOnNewStatements: () => void;
}

function NewStatementsNote({ newStatementCount, onVoteOnNewStatements }: NewStatementsNoteProps) {
  return (
    <div className="mt-4 text-center">
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={onVoteOnNewStatements}>
        Vote on {newStatementCount} new {pluralizeStatement(newStatementCount)}
      </Button>
      <p className="mt-1.5 text-xs secondary-text">Clears what you've typed</p>
    </div>
  );
}

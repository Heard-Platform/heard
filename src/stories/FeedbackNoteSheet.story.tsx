import { useState } from "react";
import { Button } from "../components/ui/button";
import { FeedbackNoteSheet } from "../components/room/FeedbackNoteSheet";
import { getFeedbackStatement } from "../utils/constants/feedback-statements";
import { StoryContainer } from "./StoryContainer";

function NoteSheetDemo({ succeeds }: { succeeds: boolean }) {
  const [open, setOpen] = useState(false);

  const handleSend = async (text: string) => {
    console.log("[Story] send note", { text, succeeds });
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (succeeds) setOpen(false);
    return succeeds;
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open sheet</Button>
      <FeedbackNoteSheet
        isOpen={open}
        statement={getFeedbackStatement("ui_confusing")}
        onSend={handleSend}
        onDismiss={() => setOpen(false)}
      />
    </>
  );
}

export function FeedbackNoteSheetStory() {
  return (
    <StoryContainer
      title="Feedback Note Sheet"
      description="Opened from Tell us more on a feedback card. Private note tied to the statement. Sending shows the sending state for 0.8s."
      variants={[
        { id: "success", label: "Send succeeds", children: <NoteSheetDemo succeeds={true} /> },
        { id: "failure", label: "Send fails", children: <NoteSheetDemo succeeds={false} /> },
      ]}
    />
  );
}

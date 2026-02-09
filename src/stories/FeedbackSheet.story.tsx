import { useState } from "react";
import { FeedbackSheet } from "../components/FeedbackSheet";
import { Button } from "../components/ui/button";

export function FeedbackSheetStory() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>
        Open Feedback Sheet
      </Button>

      <FeedbackSheet
        userId="demo-user-123"
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}

import { useState } from "react";
import { EventQuestionsDrawer } from "../components/room/EventQuestionsDrawer";
import { Button } from "../components/ui/button";
import { CAMPUS_EVENT_QUESTIONS } from "./EventOnboarding.story";
import { StoryContainer } from "./StoryContainer";

function EventQuestionsDrawerDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<
    string[]
  >([]);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);
  const handleReset = () => setAnsweredQuestionIds([]);

  const handleAnswer = (questionId: string, answers: string[]) => {
    console.log("[Story] answer", questionId, answers);
    setAnsweredQuestionIds((previous) => [...previous, questionId]);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleOpen}>Keep voting</Button>
      <Button variant="outline" onClick={handleReset}>
        Reset answers
      </Button>
      <EventQuestionsDrawer
        isOpen={isOpen}
        questions={CAMPUS_EVENT_QUESTIONS}
        answeredQuestionIds={answeredQuestionIds}
        onAnswer={handleAnswer}
        onClose={handleClose}
      />
    </div>
  );
}

export function EventQuestionsDrawerStory() {
  return (
    <StoryContainer
      title="Event Questions Drawer"
      description="What Keep voting on the event invite card opens in the feed: the event's questions in a bottom drawer, with the keep-voting welcome, then one question per screen. Finishing or dragging it down closes it and the deck goes on. Answers given before closing are kept."
      variants={[
        {
          id: "keep-voting",
          label: "Keep voting",
          description:
            "Open it with Keep voting. Checks the welcome and each question fit a short phone inside the drawer, Learn more opens the privacy sheet over it, and closing mid-way then reopening resumes at the first unanswered question. Answers log to the console.",
          children: <EventQuestionsDrawerDemo />,
        },
      ]}
    />
  );
}

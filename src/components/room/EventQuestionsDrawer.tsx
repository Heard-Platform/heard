import { useState } from "react";
import type { DemographicQuestion } from "../../types";
import { EventOnboarding } from "../events/attendee/EventOnboarding";
import { Drawer, DrawerContent, DrawerTitle } from "../ui/drawer";
import { EventQuestionsEndScreen } from "./EventQuestionsEndScreen";

interface EventQuestionsDrawerProps {
  isOpen: boolean;
  questions: DemographicQuestion[];
  answeredQuestionIds: string[];
  onAnswer: (questionId: string, answers: string[]) => void;
  onClose: () => void;
}

export function EventQuestionsDrawer({
  isOpen,
  questions,
  answeredQuestionIds,
  onAnswer,
  onClose,
}: EventQuestionsDrawerProps) {
  const [hasFinishedQuestions, setHasFinishedQuestions] =
    useState(false);

  const handleFinishQuestions = () => setHasFinishedQuestions(true);

  const handleClose = () => {
    setHasFinishedQuestions(false);
    onClose();
  };

  const handleOpenChange = (isNowOpen: boolean) => {
    if (!isNowOpen) handleClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent className="heard-feed-bg h-[80vh] overflow-hidden rounded-t-3xl border-none">
        <DrawerTitle className="sr-only">Quick questions</DrawerTitle>
        <div className="flex min-h-0 flex-1 flex-col">
          {hasFinishedQuestions ? (
            <EventQuestionsEndScreen onBackToVoting={handleClose} />
          ) : (
            <EventOnboarding
              questions={questions}
              welcomeVariant="keep-voting"
              answeredQuestionIds={answeredQuestionIds}
              onAnswer={onAnswer}
              onFinish={handleFinishQuestions}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

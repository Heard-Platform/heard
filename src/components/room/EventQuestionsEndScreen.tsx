import { useState } from "react";
import { AttendeeFrame } from "../events/attendee/AttendeeFrame";
import { Button } from "../ui/button";
import { AnswerPrivacySheet } from "../events/attendee/AnswerPrivacySheet";

interface EventQuestionsEndScreenProps {
  onBackToVoting: () => void;
}

export function EventQuestionsEndScreen({
  onBackToVoting,
}: EventQuestionsEndScreenProps) {
  const [isAnswerPrivacySheetOpen, setIsAnswerPrivacySheetOpen] =
    useState(false);

  const handleOpenAnswerPrivacySheet = () =>
    setIsAnswerPrivacySheetOpen(true);

  const handleCloseAnswerPrivacySheet = () =>
    setIsAnswerPrivacySheetOpen(false);

  return (
    <AttendeeFrame>
      <div className="flex flex-1 flex-col justify-center gap-6 px-1">
        <div className="space-y-2.5">
          <h1 className="text-[34px] font-extrabold leading-[1.1] tracking-tight dark-text">
            Thanks for sharing
          </h1>
          <p className="text-base leading-snug secondary-text-strong">
            Your answers help us ensure all voices are being represented and are only shown in group totals.{" "}
            <button
              type="button"
              className="underline"
              onClick={handleOpenAnswerPrivacySheet}
            >
              Learn more
            </button>
          </p>
        </div>
      </div>

      <Button
        size="lg"
        className="h-14 w-full rounded-xl text-lg font-bold"
        onClick={onBackToVoting}
      >
        Back to voting
      </Button>

      <AnswerPrivacySheet
        isOpen={isAnswerPrivacySheetOpen}
        onClose={handleCloseAnswerPrivacySheet}
      />
    </AttendeeFrame>
  );
}

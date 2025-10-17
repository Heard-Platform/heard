import { motion } from "motion/react";
import { Card } from "./ui/card";
import { RantSubmission } from "./RantSubmission";
import { StatementSubmission } from "./StatementSubmission";
import { Users } from "lucide-react";
import type { Rant } from "../types";

interface RantingPhaseProps {
  isRantFirstRoom: boolean;
  isSubmissionPhase: boolean;
  userHasSubmittedRant: boolean;
  hasEnoughRantsForAnonymity: boolean;
  initialDataLoaded: boolean;
  isSubmittingRant: boolean;
  rants: Rant[];
  roomPhase: string;
  onSubmitRant: (text: string) => Promise<void>;
  onSubmitStatement: (text: string) => Promise<void>;
}

export function RantingPhase({
  isRantFirstRoom,
  isSubmissionPhase,
  userHasSubmittedRant,
  hasEnoughRantsForAnonymity,
  initialDataLoaded,
  isSubmittingRant,
  rants,
  roomPhase,
  onSubmitRant,
  onSubmitStatement,
}: RantingPhaseProps) {
  const shouldShowRantSubmission =
    isRantFirstRoom && !userHasSubmittedRant && isSubmissionPhase;

  const shouldShowHoldingState =
    isRantFirstRoom &&
    userHasSubmittedRant &&
    !hasEnoughRantsForAnonymity &&
    isSubmissionPhase;

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-2xl">
        {!initialDataLoaded ? (
          <Card className="p-6">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
              />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </Card>
        ) : shouldShowRantSubmission ? (
          <RantSubmission
            onSubmit={onSubmitRant}
            isSubmitting={isSubmittingRant}
            placeholder="Share your unfiltered thoughts on this topic and we'll create debate points from your rant!"
          />
        ) : shouldShowHoldingState ? (
          <Card className="p-6 bg-purple-50 border-purple-200">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-purple-900">Rant Submitted! 🎉</h3>
                <p className="text-sm text-purple-700">
                  We're waiting for a few more players to submit rants before
                  showing statements to help protect anonymity.
                </p>
                <div className="text-xs text-purple-600 bg-purple-100 p-3 rounded">
                  {rants.length} / 3 rants submitted so far
                </div>
              </div>
              <div className="flex justify-center items-center space-x-1 pt-2">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0,
                  }}
                  className="w-2 h-2 bg-purple-600 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0.2,
                  }}
                  className="w-2 h-2 bg-purple-600 rounded-full"
                />
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: 0.4,
                  }}
                  className="w-2 h-2 bg-purple-600 rounded-full"
                />
              </div>
            </div>
          </Card>
        ) : (
          <StatementSubmission
            onSubmit={onSubmitStatement}
            currentPhase={roomPhase}
            isActive={isSubmissionPhase}
            placeholder={
              isRantFirstRoom
                ? "Add more specific points to the discussion 🎯"
                : "What's your take? Spicy takes welcome! 🌶️"
            }
          />
        )}
      </div>
    </div>
  );
}

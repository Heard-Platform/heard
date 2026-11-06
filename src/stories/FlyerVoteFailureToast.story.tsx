import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ANONYMOUS_ACTION_NOT_ALLOWED_ERROR,
} from "../utils/constants/errors";
import { flyerVoteFailureMessage } from "../utils/flyer-vote-errors";

// @ts-ignore
import { toast } from "sonner@2.0.3";

const TOAST_DELAY_DURING_SPINNER_MS = 600;
const SPINNER_DURATION_MS = 2000;

export function FlyerVoteFailureToastStory() {
  const [isJoiningAnonymously, setIsJoiningAnonymously] =
    useState(false);

  const showAccountRequiredToast = () => {
    toast.error(
      flyerVoteFailureMessage(ANONYMOUS_ACTION_NOT_ALLOWED_ERROR),
    );
  };

  const showGenericFailureToast = () => {
    toast.error(flyerVoteFailureMessage("HTTP 500"));
  };

  const failDuringSpinner = () => {
    setIsJoiningAnonymously(true);
    setTimeout(
      showAccountRequiredToast,
      TOAST_DELAY_DURING_SPINNER_MS,
    );
    setTimeout(
      () => setIsJoiningAnonymously(false),
      SPINNER_DURATION_MS,
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flyer Vote Failure Toast</CardTitle>
        <CardDescription>
          The toasts a scanner sees when a flyer vote fails. "Fail
          during spinner" fires the toast while the joining spinner
          is up, then swaps the spinner out; the toast should stay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isJoiningAnonymously ? (
          <div className="heard-center h-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-8 h-8 heard-spinner"
            />
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button onClick={showAccountRequiredToast}>
              Account required
            </Button>
            <Button
              variant="outline"
              onClick={showGenericFailureToast}
            >
              Other failure
            </Button>
            <Button variant="secondary" onClick={failDuringSpinner}>
              Fail during spinner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

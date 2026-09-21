import { useEffect } from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Mail } from "lucide-react";
import { RenderedStatement } from "./RenderedStatement";
import { ConfettiBurst } from "./ConfettiBurst";
import { EmailInputField } from "./onboarding/EmailInputField";
import { TOSText } from "./onboarding/TOSText";
import { CertifyOtpStep } from "./room/CertifyOtpStep";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import { useDebateSession } from "../hooks/useDebateSession";
import { api } from "../utils/api";

interface AnonResponseTripwireProps {
  roomId: string;
  statementText: string;
  isOpen: boolean;
  onComplete: () => void;
  onDismiss: () => void;
}

export function AnonResponseTripwire({
  roomId,
  statementText,
  isOpen,
  onComplete,
  onDismiss,
}: AnonResponseTripwireProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 bg-transparent">
        <DialogTitle className="sr-only">Your take is live</DialogTitle>
        <DialogDescription className="sr-only">
          Add your email to see who agrees and disagrees with the statement you just posted.
        </DialogDescription>
        <TripwireCard
          roomId={roomId}
          statementText={statementText}
          onComplete={onComplete}
          onDismiss={onDismiss}
        />
      </DialogContent>
    </Dialog>
  );
}

function TripwireCard({
  roomId,
  statementText,
  onComplete,
  onDismiss,
}: Omit<AnonResponseTripwireProps, "isOpen">) {
  const { user } = useDebateSession();
  const emailFlow = useEmailOtpFlow({ onComplete: () => onComplete() });
  const isPhoneOnlyUser = !!user && !user.isAnonymous;

  useEffect(() => {
    api.trackEvent("anon_response_tripwire_shown", roomId);
  }, [roomId]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    api.trackEvent("anon_response_tripwire_submitted", roomId);
    emailFlow.submitEmail();
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.9, opacity: 0, y: 20 }}
      className="relative bg-gradient-to-br from-emerald-500 to-cyan-500 p-1 rounded-lg"
    >
      <ConfettiBurst />
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6 space-y-5">
        {emailFlow.step === "otp" ? (
          <CertifyOtpStep
            email={emailFlow.email}
            otp={emailFlow.otp}
            error={emailFlow.error}
            loading={emailFlow.submitting}
            onOtpChange={emailFlow.setOtp}
            onSubmit={emailFlow.submitOtp}
            onBack={emailFlow.goBackToEmail}
          />
        ) : (
          <>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
            >
              Your take is live 🎉
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm italic text-center bg-muted rounded-md px-4 py-2"
            >
              "<RenderedStatement text={statementText} />"
            </motion.p>

            <div className="text-center space-y-1">
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
              >
                {isPhoneOnlyUser
                  ? "But, oops! We don't have your email"
                  : "Now find out who agrees"}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="text-muted-foreground text-sm"
              >
                Drop your email to see how people vote.
              </motion.p>
            </div>

            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit}
              noValidate
              className="space-y-3"
            >
              <EmailInputField
                value={emailFlow.email}
                onChange={emailFlow.setEmail}
                disabled={emailFlow.submitting}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                We'll only use your email to tell you about votes, never for anything else. Unsubscribe anytime.
              </p>
              {!isPhoneOnlyUser && <TOSText />}

              {emailFlow.error && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {emailFlow.error}
                </motion.p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDismiss}
                  disabled={emailFlow.submitting}
                  className="flex-1"
                >
                  Not now
                </Button>
                <Button
                  type="submit"
                  disabled={emailFlow.submitting}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
                >
                  {emailFlow.submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 mr-2"
                      >
                        <Mail className="w-4 h-4" />
                      </motion.div>
                      Sending...
                    </>
                  ) : (
                    "Find Out"
                  )}
                </Button>
              </div>
            </motion.form>
          </>
        )}
      </div>
    </motion.div>
  );
}

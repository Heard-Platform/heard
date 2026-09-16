import { useState } from "react";
import { motion } from "motion/react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Users, Mail } from "lucide-react";
import { isValidEmail } from "../utils/validation";
import { RenderedStatement } from "./RenderedStatement";
import { EmailInputField } from "./onboarding/EmailInputField";
import { TOSText } from "./onboarding/TOSText";

interface FindOutWhoAgreesTripwireProps {
  statementText: string;
  isOpen: boolean;
  submitting: boolean;
  error: string | null;
  onSubmitEmail: (email: string) => void;
  onDismiss: () => void;
}

export function FindOutWhoAgreesTripwire({
  statementText,
  isOpen,
  submitting,
  error,
  onSubmitEmail,
  onDismiss,
}: FindOutWhoAgreesTripwireProps) {
  const [email, setEmail] = useState("");

  const canSubmit = isValidEmail(email.trim()) && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmitEmail(email.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 bg-transparent">
        <DialogTitle className="sr-only">Find out who agrees with you</DialogTitle>
        <DialogDescription className="sr-only">
          Add your email to see who agrees and disagrees with the statement you just posted.
        </DialogDescription>
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-1 rounded-lg"
        >
          <div className="bg-white dark:bg-gray-950 rounded-lg p-6 space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full blur-lg opacity-50" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>

            <div className="text-center space-y-2">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
              >
                Your take is live 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-sm"
              >
                Want to know who agrees with you, and who doesn't?
              </motion.p>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-sm italic text-center bg-muted rounded-md px-4 py-2"
            >
              "<RenderedStatement text={statementText} />"
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <EmailInputField
                value={email}
                onChange={setEmail}
                disabled={submitting}
                autoFocus
              />
              <TOSText />

              {error && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDismiss}
                  disabled={submitting}
                  className="flex-1"
                >
                  Not now
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  {submitting ? (
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
                    "Join"
                  )}
                </Button>
              </div>
            </motion.form>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

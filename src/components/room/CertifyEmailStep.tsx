import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { motion } from "motion/react";
import { Send, Sparkles } from "lucide-react";
import { TOSText } from "../onboarding/TOSText";

interface CertifyEmailStepProps {
  email: string;
  error: string | null;
  loading: boolean;
  isActive: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}

export function CertifyEmailStep({
  email,
  error,
  loading,
  isActive,
  onEmailChange,
  onSubmit,
}: CertifyEmailStepProps) {
  return (
    <motion.div
      key="email"
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className="mb-6 flex flex-col items-center space-y-1 text-center">
        <p
          className="text-lg text-foreground"
          style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}
        >
          Add your Seal of Approval 🦭
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Drop your email below to verify your votes and see the results so far.
        </p>
      </div>

      <div className="mb-4 w-full max-w-xs">
        <div className="relative">
          <motion.div
            className="absolute -inset-1 rounded-lg creation-bg opacity-30"
            animate={{ scale: [1, 1.04, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          />
          <div className="relative flex gap-2">
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              className="bg-background"
            />
            <Button
              onClick={onSubmit}
              disabled={loading}
              size="icon"
              className="creation-bg-strong hover:creation-bg-strong-hover shrink-0"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        {error && (
          <p className="text-xs error-text mt-1 text-center">{error}</p>
        )}
      </div>

      <div className="pt-2 border-t w-full text-center">
        <TOSText />
      </div>

      {isActive && (
        <div className="pt-2">
          <p className="text-xs text-center secondary-text">
            Swipe away to skip
          </p>
        </div>
      )}
    </motion.div>
  );
}

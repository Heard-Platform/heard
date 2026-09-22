import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { motion } from "motion/react";
import { Send, Sparkles } from "lucide-react";
import { LiveHighlights, type LiveHighlight } from "../results/LiveHighlights";
import { TOSText } from "../onboarding/TOSText";

interface CertifyEmailStepProps {
  email: string;
  error: string | null;
  loading: boolean;
  teaserHighlight: LiveHighlight | null;
  agreeingVotes: number;
  isActive: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}

function getAgreementHeader(agreeingVotes: number) {
  return agreeingVotes === 1
    ? "1 vote agrees with you"
    : `${agreeingVotes} votes agree with you`;
}

export function CertifyEmailStep({
  email,
  error,
  loading,
  teaserHighlight,
  agreeingVotes,
  isActive,
  onEmailChange,
  onSubmit,
}: CertifyEmailStepProps) {
  const hasAgreement = agreeingVotes > 0;

  return (
    <motion.div
      key="email"
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <div className="mb-3 flex flex-col items-center space-y-1 text-center">
        <p
          className="text-lg text-foreground"
          style={{ fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}
        >
          {hasAgreement ? getAgreementHeader(agreeingVotes) : "See where you stand"}
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          {hasAgreement
            ? "Now let's see who disagrees!"
            : "And what others think"}
        </p>
      </div>

      {teaserHighlight && (
        <div className="relative mb-5 w-full max-w-xs">
          <div
            aria-hidden
            className="pointer-events-none select-none blur-[5px] opacity-70"
          >
            <LiveHighlights highlights={[teaserHighlight]} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm"
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              See live results by adding your email
            </motion.div>
          </div>
        </div>
      )}

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
        <TOSText prefix="We never spam or share your data, and you can unsubscribe anytime. " />
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

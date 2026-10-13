import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { FounderAvatar } from "./FounderAvatar";
import { PersonalEmailCard } from "./PersonalEmailCard";
import { PersonalFlyerHeader } from "./PersonalFlyerHeader";
import { COLORS, FOUNDER_NAME, HEADLINE_CLASS } from "./personal-flyer-theme";

interface PersonalWhoDisScreenProps {
  emailFlow: EmailOtpFlow;
  onBack: () => void;
}

export function PersonalWhoDisScreen({ emailFlow, onBack }: PersonalWhoDisScreenProps) {
  return (
    <div className="heard-feed-bg flex min-h-full flex-col px-7 pb-7 pt-8">
      <PersonalFlyerHeader onBack={onBack} />

      <div className="mt-6 flex items-center gap-4">
        <FounderAvatar sizePx={104} />
        <h1 className={`${HEADLINE_CLASS} text-[34px]`} style={{ color: COLORS.ink }}>
          Hi, I'm {FOUNDER_NAME}.
        </h1>
      </div>

      <div className="mt-5 space-y-3 text-base leading-relaxed" style={{ color: COLORS.body }}>
        <p>
          I'm a DC native, software engineer, and former firefighter. I'm building Heard because I think
          neighbors should have an easy, fun way to hear each other out.
        </p>
        <p>So, thanks again for scanning my flyer and being part of this wild experiment.</p>
        <p className="pt-2">Now give me your email. (Please.)</p>
      </div>

      <div className="mt-auto pt-6">
        <PersonalEmailCard emailFlow={emailFlow} />
      </div>
    </div>
  );
}

import type { FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import type { EmailOtpFlow } from "../../hooks/useEmailOtpFlow";
import { TOSText } from "../onboarding/TOSText";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../ui/drawer";
import { FEEDBACK_FONT_STYLE, FeedbackPill } from "./FeedbackCard";

export type EmailAskReason = "founder" | "note";

interface EmailAskSheetProps {
  isOpen: boolean;
  reason?: EmailAskReason;
  emailFlow: EmailOtpFlow;
  onNotNow: () => void;
  onDismiss: () => void;
}

const EMAIL_COPY: Record<EmailAskReason, { title: string; description: string }> = {
  founder: {
    title: "Awesome, let's talk",
    description: "Leave your email and Alex will reach out to find a time.",
  },
  note: {
    title: "Thanks! Want a reply?",
    description: "Leave your email and Alex can follow up on your note.",
  },
};

const INPUT_CLASS =
  "min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:border-stone-800";
const SUBMIT_CLASS =
  "shrink-0 rounded-xl bg-stone-900 px-4 py-3 text-base font-bold text-white disabled:opacity-60";

export function EmailAskSheet({
  isOpen,
  reason = "founder",
  emailFlow,
  onNotNow,
  onDismiss,
}: EmailAskSheetProps) {
  const isCodeStep = emailFlow.step === "otp";

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
      <DrawerContent className="rounded-t-3xl border-none bg-white" style={FEEDBACK_FONT_STYLE}>
        <div className="px-5 pb-6 pt-5">
          <FeedbackPill />

          {isCodeStep ? <CodeStep emailFlow={emailFlow} /> : <EmailStep reason={reason} emailFlow={emailFlow} />}

          {emailFlow.error && <p className="mt-2 text-center text-sm error-text">{emailFlow.error}</p>}

          <button className="mt-4 w-full py-2 text-sm font-semibold text-stone-600" onClick={onNotNow}>
            No thanks
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function EmailStep({ reason, emailFlow }: { reason: EmailAskReason; emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <>
      <DrawerTitle className="mt-3 text-2xl font-extrabold tracking-tight leading-tight text-stone-900">
        {EMAIL_COPY[reason].title}
      </DrawerTitle>
      <DrawerDescription className="mt-1 text-base text-stone-600">
        {EMAIL_COPY[reason].description}
      </DrawerDescription>

      <form className="mt-5 flex gap-2" noValidate onSubmit={handleSubmit}>
        <input
          className={INPUT_CLASS}
          type="email"
          autoComplete="email"
          aria-label="Email"
          placeholder="you@example.com"
          value={emailFlow.email}
          onChange={(event) => emailFlow.setEmail(event.target.value)}
        />
        <button className={SUBMIT_CLASS} type="submit" disabled={emailFlow.submitting}>
          {emailFlow.submitting ? "Sending…" : "Send"}
        </button>
      </form>
      <TOSText
        prefix="This also saves your Heard account. No spam. "
        className="mt-2 text-center text-xs text-stone-500"
        linkClassName="font-semibold text-stone-700 underline"
      />
    </>
  );
}

function CodeStep({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitOtp();
  };

  return (
    <>
      <DrawerTitle className="mt-3 text-2xl font-extrabold tracking-tight leading-tight text-stone-900">
        Welcome back
      </DrawerTitle>
      <DrawerDescription className="mt-1 text-base text-stone-600">
        That email already has an account. We sent a 6-character code to{" "}
        <strong className="text-stone-900">{emailFlow.email}</strong>.
      </DrawerDescription>

      <form className="mt-5 flex gap-2" noValidate onSubmit={handleSubmit}>
        <input
          className={`${INPUT_CLASS} font-mono uppercase tracking-widest`}
          type="text"
          autoComplete="one-time-code"
          aria-label="Login code"
          placeholder="ABC123"
          maxLength={6}
          autoFocus
          value={emailFlow.otp}
          onChange={(event) => emailFlow.setOtp(event.target.value)}
        />
        <button className={SUBMIT_CLASS} type="submit" disabled={emailFlow.submitting}>
          {emailFlow.submitting ? "Checking…" : "Log in"}
        </button>
      </form>

      <button
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-stone-500"
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-3 w-3" />
        Use a different email
      </button>
    </>
  );
}

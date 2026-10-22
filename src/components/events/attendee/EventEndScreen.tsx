import type { FormEvent } from "react";
import { ChevronLeft } from "lucide-react";
import type { EmailOtpFlow } from "../../../hooks/useEmailOtpFlow";
import { TOSText } from "../../onboarding/TOSText";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { AttendeeFrame, AttendeeMessage } from "./AttendeeFrame";

const INPUT_CLASS = "heard-card-bg h-12 rounded-xl text-base md:text-base";

interface EventEndScreenProps {
  emailFlow: EmailOtpFlow;
  sentTo: string | null;
}

export function EventEndScreen({ emailFlow, sentTo }: EventEndScreenProps) {
  return (
    <AttendeeFrame>
      {sentTo && (
        <div className="my-auto">
          <AttendeeMessage title="Check your inbox" body={`The results are on their way to ${sentTo}.`} />
        </div>
      )}
      {!sentTo && emailFlow.step === "email" && <EmailStep emailFlow={emailFlow} />}
      {!sentTo && emailFlow.step === "otp" && <CodeStep emailFlow={emailFlow} />}
    </AttendeeFrame>
  );
}

function EmailStep({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <form className="flex flex-1 flex-col" noValidate onSubmit={handleSubmit}>
      <div className="my-auto">
        <AttendeeMessage
          title="Thanks for weighing in."
          body="Get the results by email: where the room agreed and where it split."
        />
      </div>

      <Input
        className={INPUT_CLASS}
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={emailFlow.email}
        onChange={(event) => emailFlow.setEmail(event.target.value)}
      />
      <StepError error={emailFlow.error} />
      <Button type="submit" size="lg" className="mt-3 w-full" disabled={emailFlow.submitting}>
        {emailFlow.submitting ? "Sending…" : "Send me the results"}
      </Button>
      <TOSText
        className="mt-2 text-center text-xs secondary-text"
        linkClassName="font-semibold underline"
      />
    </form>
  );
}

function CodeStep({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitOtp();
  };

  return (
    <form className="flex flex-1 flex-col" noValidate onSubmit={handleSubmit}>
      <div className="my-auto">
        <AttendeeMessage
          title="Welcome back."
          body={`That email already has an account. We sent a 6-character code to ${emailFlow.email}.`}
        />
      </div>

      <Input
        className={`${INPUT_CLASS} font-mono uppercase tracking-widest`}
        type="text"
        autoComplete="one-time-code"
        placeholder="ABC123"
        maxLength={6}
        autoFocus
        value={emailFlow.otp}
        onChange={(event) => emailFlow.setOtp(event.target.value)}
      />
      <StepError error={emailFlow.error} />
      <Button type="submit" size="lg" className="mt-3 w-full" disabled={emailFlow.submitting}>
        {emailFlow.submitting ? "Checking…" : "Log in"}
      </Button>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="mx-auto mt-1 gap-1 secondary-text"
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-3 w-3" />
        Use a different email
      </Button>
    </form>
  );
}

function StepError({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mt-2 text-center text-sm text-destructive">{error}</p>;
}

import type { FormEvent } from "react";
import { ArrowRight, ChevronLeft, Lock, Rainbow, type LucideIcon } from "lucide-react";
import { getClusterDisplayName } from "../../utils/colors";
import type { EmailOtpFlow } from "../../hooks/useEmailOtpFlow";
import { TOSText } from "../onboarding/TOSText";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "../ui/drawer";
import { slotTextColorOnLight, type MinimapCluster } from "../room/ClusterMinimap";

interface SaveSpotDrawerProps {
  isOpen: boolean;
  tribe: MinimapCluster | null;
  emailFlow: EmailOtpFlow;
  onNotNow: () => void;
  onDismiss: () => void;
}

const NOTIFY_REASONS: { icon: LucideIcon; text: string }[] = [
  { icon: ArrowRight, text: "Your group shifts" },
  { icon: Rainbow, text: "A new bridge shows up" },
  { icon: Lock, text: "The results lock in" },
];

const ACCENT = "#E4603C";
const INPUT_CLASS =
  "min-w-0 flex-1 rounded-xl border border-[#E3DDD1] bg-white px-4 py-3 text-base text-[#1C1B1F] outline-none placeholder:text-[#A8A298] focus:border-[#1c1a2b]";
const SUBMIT_CLASS = "shrink-0 rounded-xl px-4 py-3 text-base font-bold text-white disabled:opacity-60";

export function SaveSpotDrawer({ isOpen, tribe, emailFlow, onNotNow, onDismiss }: SaveSpotDrawerProps) {
  const isCodeStep = emailFlow.step === "otp";

  return (
    <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onDismiss()}>
      <DrawerContent className="rounded-t-3xl border-none bg-[#F2EEE3]">
        <div className="px-5 pb-6 pt-5">
          {tribe && (
            <div className="flex items-center gap-2.5">
              <TribeIcon />
              <span
                className="text-xs font-extrabold uppercase tracking-wider"
                style={{ color: slotTextColorOnLight(tribe.slot) }}
              >
                {getClusterDisplayName(tribe.slot, tribe.name)}
              </span>
            </div>
          )}

          {isCodeStep ? <CodeStep emailFlow={emailFlow} /> : <EmailStep emailFlow={emailFlow} />}

          {emailFlow.error && <p className="mt-2 text-center text-sm text-[#C2410C]">{emailFlow.error}</p>}

          <button className="mt-4 w-full py-2 text-sm font-semibold text-[#4A463F]" onClick={onNotNow}>
            Not now
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function EmailStep({ emailFlow }: { emailFlow: EmailOtpFlow }) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    emailFlow.submitEmail();
  };

  return (
    <>
      <DrawerTitle className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#1C1B1F]">
        Your spot is yours now.
      </DrawerTitle>
      <DrawerDescription className="mt-1 text-base text-[#4A463F]">
        Where should we send word when it moves?
      </DrawerDescription>

      <ul className="mt-4 flex flex-col gap-2.5">
        {NOTIFY_REASONS.map(({ icon, text }) => (
          <NotifyReason key={text} icon={icon} text={text} />
        ))}
      </ul>

      <form className="mt-5 flex gap-2" noValidate onSubmit={handleSubmit}>
        <input
          className={INPUT_CLASS}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={emailFlow.email}
          onChange={(event) => emailFlow.setEmail(event.target.value)}
        />
        <button
          className={SUBMIT_CLASS}
          style={{ backgroundColor: ACCENT }}
          type="submit"
          disabled={emailFlow.submitting}
        >
          {emailFlow.submitting ? "Saving…" : "Save"}
        </button>
      </form>
      <TOSText
        prefix="No password. No spam. "
        className="mt-2 text-center text-xs text-[#6B6760]"
        linkClassName="font-semibold text-[#4A463F] underline"
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
      <DrawerTitle className="mt-3 text-[28px] font-extrabold leading-tight tracking-tight text-[#1C1B1F]">
        Welcome back.
      </DrawerTitle>
      <DrawerDescription className="mt-1 text-base text-[#4A463F]">
        That email already has an account. We sent a 6-character code to{" "}
        <strong className="text-[#1C1B1F]">{emailFlow.email}</strong>.
      </DrawerDescription>

      <form className="mt-5 flex gap-2" noValidate onSubmit={handleSubmit}>
        <input
          className={`${INPUT_CLASS} font-mono uppercase tracking-widest`}
          type="text"
          autoComplete="one-time-code"
          placeholder="ABC123"
          maxLength={6}
          autoFocus
          value={emailFlow.otp}
          onChange={(event) => emailFlow.setOtp(event.target.value)}
        />
        <button
          className={SUBMIT_CLASS}
          style={{ backgroundColor: ACCENT }}
          type="submit"
          disabled={emailFlow.submitting}
        >
          {emailFlow.submitting ? "Checking…" : "Log in"}
        </button>
      </form>

      <button
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#6B6760]"
        onClick={emailFlow.goBackToEmail}
      >
        <ChevronLeft className="h-3 w-3" />
        Use a different email
      </button>
    </>
  );
}

function TribeIcon() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "#1c1a2b" }}>
      <div
        className="h-3.5 w-3.5 rounded-full"
        style={{ backgroundColor: "#f97316", border: "2px solid white", boxShadow: "0 0 0 3px #f9731655" }}
      />
    </div>
  );
}

function NotifyReason({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8E3D6]">
        <Icon className="h-4 w-4 text-[#1C1B1F]" />
      </div>
      <span className="text-sm font-semibold text-[#1C1B1F]">{text}</span>
    </li>
  );
}

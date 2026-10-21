import { useState } from "react";
import { Button } from "../components/ui/button";
import { EmailAskSheet, type EmailAskReason } from "../components/room/EmailAskSheet";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { useEmailOtpFlow } from "../hooks/useEmailOtpFlow";
import type { UserSession } from "../types";
import { mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

type AuthPath = "signup" | "otp";

const storyUser: UserSession = { ...mockUser, id: "story-user", isAnonymous: true };

const buildOverrides = (authPath: AuthPath) => ({
  user: storyUser,
  anonAddEmailAndLogin: async (email: string) => {
    console.log("[Story] anonAddEmailAndLogin", { email, authPath });
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (authPath === "otp") {
      return { success: true, data: { requiresOtp: true as const, email } };
    }
    return { success: true, data: { requiresOtp: false as const, user: mockUser } };
  },
  verifyMagicLink: async (code: string) => {
    console.log("[Story] verifyMagicLink", { code });
    return { success: true, data: { user: mockUser, sessionId: "story-session" } };
  },
});

function SheetWithFlow({ reason }: { reason: EmailAskReason }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const emailFlow = useEmailOtpFlow({
    onComplete: () => {
      setDone(true);
      setOpen(false);
    },
  });

  return (
    <div className="space-y-3">
      <Button onClick={() => { setDone(false); setOpen(true); }}>Open sheet</Button>
      {done && <p className="text-sm text-muted-foreground">Account saved and logged in. Sheet closed.</p>}
      <EmailAskSheet
        isOpen={open}
        reason={reason}
        emailFlow={emailFlow}
        onNotNow={() => setOpen(false)}
        onDismiss={() => setOpen(false)}
      />
    </div>
  );
}

function EmailAskDemo({ authPath, reason }: { authPath: AuthPath; reason: EmailAskReason }) {
  return (
    <DebateSessionProvider showcaseOverrides={buildOverrides(authPath)}>
      <SheetWithFlow reason={reason} />
    </DebateSessionProvider>
  );
}

export function EmailAskSheetStory() {
  return (
    <StoryContainer
      title="Email Ask Sheet"
      description="Asks anon users for an email after they agree to the founder chat card or send a note. Also creates their account. Enter an invalid email to see validation."
      variants={[
        { id: "signup", label: "Founder, new email", children: <EmailAskDemo authPath="signup" reason="founder" /> },
        { id: "otp", label: "Founder, taken email (OTP)", children: <EmailAskDemo authPath="otp" reason="founder" /> },
        { id: "note", label: "After a note", children: <EmailAskDemo authPath="signup" reason="note" /> },
      ]}
    />
  );
}

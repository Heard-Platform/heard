import { useState } from "react";
import { AnonResponseTripwire } from "../components/AnonResponseTripwire";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { mockUser } from "./mockData";

export default {
  title: "Onboarding/AnonResponseTripwire",
};

const STATEMENT_TEXT =
  "Pineapple belongs on pizza and makes it sweet and savory perfection!";

type Scenario = "signup" | "otp" | "error" | "no-email-account" | "duplicate-account";

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "signup", label: "Anonymous, new email (signup)" },
  { id: "otp", label: "Anonymous, existing email (OTP)" },
  { id: "error", label: "Anonymous, signup fails" },
  { id: "no-email-account", label: "Phone-only user, new email (add to account)" },
  { id: "duplicate-account", label: "Phone-only user, email already registered" },
];

const buildOverrides = (scenario: Scenario) => ({
  user: {
    ...mockUser,
    isAnonymous: scenario !== "no-email-account" && scenario !== "duplicate-account",
    email: "",
  },
  anonAddEmailAndLogin: async (email: string) => {
    console.log("[Story] anonAddEmailAndLogin", { email, scenario });
    if (scenario === "error") {
      return { success: false, error: "Something went wrong. Please try again." };
    }
    if (scenario === "otp") {
      return { success: true, data: { requiresOtp: true as const, email } };
    }
    return { success: true, data: { requiresOtp: false as const, user: mockUser } };
  },
  addEmailToAccount: async (email: string) => {
    console.log("[Story] addEmailToAccount", { email, scenario });
    if (scenario === "duplicate-account") {
      return {
        success: false,
        error:
          "An account already exists with this email. Our team has been notified of this possible duplicate account issue and will look into it.",
      };
    }
    return { success: true };
  },
  verifyMagicLink: async (code: string) => {
    console.log("[Story] verifyMagicLink", { code });
    return { success: true, data: { user: mockUser, sessionId: "story-session" } };
  },
});

export function AnonResponseTripwireStory() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [completed, setCompleted] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anon Response Tripwire</CardTitle>
        <CardDescription>
          Signup modal shown right after an anonymous or no-email user posts a statement,
          timed to their moment of buy-in. New emails sign up directly, existing emails
          continue with a login code, and phone-only users add it to their account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {SCENARIOS.map(({ id, label }) => (
            <Button
              key={id}
              variant="outline"
              onClick={() => {
                setCompleted(false);
                setScenario(id);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {completed && (
          <p className="text-sm text-muted-foreground">
            ✅ Completed — the modal closed itself.
          </p>
        )}

        {scenario && (
          <DebateSessionProvider key={scenario} showcaseOverrides={buildOverrides(scenario)}>
            <AnonResponseTripwire
              statementText={STATEMENT_TEXT}
              isOpen
              onComplete={() => {
                setCompleted(true);
                setScenario(null);
              }}
              onDismiss={() => setScenario(null)}
            />
          </DebateSessionProvider>
        )}
      </CardContent>
    </Card>
  );
}

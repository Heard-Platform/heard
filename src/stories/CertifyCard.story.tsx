import { useState } from "react";
import { CertifyCard } from "../components/room/CertifyCard";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { mockRooms, mockStatements, mockUser } from "./mockData";

type AuthPath = "signup" | "otp";

export function CertifyCardStory() {
  return (
    <Tabs defaultValue="card" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="card">Card Only</TabsTrigger>
        <TabsTrigger value="stack">In Swipeable Stack</TabsTrigger>
      </TabsList>

      <TabsContent value="card">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Certify Card</h2>
            <p className="text-muted-foreground mb-6">
              Prompts anonymous users to verify their email. Two auth paths: new email (signup) goes straight to celebration; existing email triggers the OTP step.
            </p>
          </div>
          <CertifyCardIsolated />
        </div>
      </TabsContent>

      <TabsContent value="stack">
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Swipe through the statements — the certify card appears last as it would for an anonymous user.
          </p>
          <CertifyCardInStack />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function CertifyCardIsolated() {
  const [authPath, setAuthPath] = useState<AuthPath>("signup");
  const [succeeded, setSucceeded] = useState(false);

  const overrides = {
    user: { ...mockUser, isAnonymous: true },
    anonAddEmailAndLogin: async (email: string) => {
      console.log("[Story] anonAddEmailAndLogin", { email, authPath });
      if (authPath === "otp") {
        return { success: true, data: { requiresOtp: true as const, email } };
      }
      return { success: true, data: { requiresOtp: false as const, user: mockUser } };
    },
    verifyMagicLink: async (code: string) => {
      console.log("[Story] verifyMagicLink", { code });
      return { success: true, data: { user: mockUser, sessionId: "story-session" } };
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Auth path:</span>
        <Button
          size="sm"
          variant={authPath === "signup" ? "default" : "outline"}
          onClick={() => { setAuthPath("signup"); setSucceeded(false); }}
        >
          New email (signup)
        </Button>
        <Button
          size="sm"
          variant={authPath === "otp" ? "default" : "outline"}
          onClick={() => { setAuthPath("otp"); setSucceeded(false); }}
        >
          Existing email (OTP)
        </Button>
      </div>

      <div className="max-w-sm bg-gradient-to-br from-emerald-100 to-teal-50 border-2 border-emerald-300 rounded-xl p-6">
        {succeeded ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-muted-foreground">✅ Verification succeeded — card auto-dismissed.</p>
            <button
              className="text-sm underline text-primary"
              onClick={() => setSucceeded(false)}
            >
              Reset
            </button>
          </div>
        ) : (
          <DebateSessionProvider showcaseOverrides={overrides}>
            <CertifyCard
              key={authPath}
              roomId="story"
              isActive={true}
              onSuccess={() => setSucceeded(true)}
            />
          </DebateSessionProvider>
        )}
      </div>
    </div>
  );
}

function CertifyCardInStack() {
  return (
    <SwipeableStatementStack
      room={mockRooms[0]}
      statements={mockStatements["debate-with-image"]}
      currentUserId="demo-user"
      allowAnonymous={true}
      isAnonymous={true}
      chanceCardSwiped={true}
      cover={null}
      coverCardSwiped={true}
      shareCardSwiped={true}
      demographicQuestions={[]}
      answeredQuestionIds={new Set()}
      isActive={true}
      onVote={async () => {}}
      onSubmitStatement={async () => {}}
      onShowAccountSetupModal={() => {}}
      onChanceCardSwiped={async () => {}}
      onCoverCardSwiped={async () => {}}
      onShareCardSwiped={async () => {}}
      onCertifyDone={async () => {}}
      onDemographicsAnswered={() => {}}
    />
  );
}

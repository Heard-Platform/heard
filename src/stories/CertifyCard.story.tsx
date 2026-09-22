import { useState } from "react";
import { CertifyCard } from "../components/room/CertifyCard";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import type { Statement, UserSession, VoteType } from "../types";
import { mockRooms, mockUser } from "./mockData";

type AuthPath = "signup" | "otp";

const STORY_USER_ID = "story-user";

const storyUser: UserSession = {
  ...mockUser,
  id: STORY_USER_ID,
  isAnonymous: true,
};

const makeStatement = (
  id: string,
  roomId: string,
  text: string,
  othersAgree: number,
  othersDisagree: number,
  userVote: VoteType | null,
): Statement => {
  const voters: Statement["voters"] = {};
  for (let i = 0; i < othersAgree; i++) voters[`${id}-agree-${i}`] = "agree";
  for (let i = 0; i < othersDisagree; i++) voters[`${id}-disagree-${i}`] = "disagree";
  if (userVote) voters[STORY_USER_ID] = userVote;

  const userAgrees = userVote === "agree" || userVote === "super_agree";

  return {
    id,
    text,
    author: `${id}-agree-0`,
    roomId,
    timestamp: Date.now() - 4 * 60 * 1000,
    agrees: othersAgree + (userVote === "agree" ? 1 : 0),
    superAgrees: userVote === "super_agree" ? 1 : 0,
    disagrees: othersDisagree + (userVote === "disagree" ? 1 : 0),
    passes: userVote === "pass" ? 1 : 0,
    voters,
    round: 1,
  };
};

const buildStoryStatements = (roomId: string): Statement[] => [
  makeStatement("cs1", roomId, "Pineapple adds a sweet contrast to the savory flavors", 34, 6, "agree"),
  makeStatement("cs2", roomId, "Pizza toppings should be a matter of personal freedom", 29, 8, "agree"),
  makeStatement("cs3", roomId, "Putting fruit on pizza is a crime against Italy", 9, 31, "disagree"),
  makeStatement("cs4", roomId, "Ranch belongs on pizza", 11, 27, "agree"),
  makeStatement("cs5", roomId, "Deep dish is not really pizza", 22, 19, "disagree"),
  makeStatement("cs6", roomId, "Thin crust is the only crust worth eating", 26, 12, "agree"),
  makeStatement("cs7", roomId, "Cold pizza for breakfast is peak dining", 18, 20, "disagree"),
  makeStatement("cs8", roomId, "Crust is the best part", 24, 15, null),
  makeStatement("cs9", roomId, "Pizza is better than tacos", 17, 21, null),
  makeStatement("cs10", roomId, "Everyone should learn to make dough from scratch", 20, 14, null),
];

const buildOverrides = (authPath: AuthPath) => ({
  user: storyUser,
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
});

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

  const overrides = buildOverrides(authPath);

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
              statements={buildStoryStatements("story")}
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
    <DebateSessionProvider showcaseOverrides={buildOverrides("signup")}>
      <SwipeableStatementStack
        room={mockRooms[0]}
        statements={buildStoryStatements(mockRooms[0].id)}
        currentUserId={STORY_USER_ID}
        allowAnonymous={true}
        isAnonymous={true}
        chanceCardSwiped={true}
        cover={null}
        coverCardSwiped={true}
        demographicQuestions={[]}
        answeredQuestionIds={new Set()}
        isActive={true}
        onVote={async () => {}}
        onSubmitStatement={async () => {}}
        onShowAccountSetupModal={() => {}}
        onChanceCardSwiped={async () => {}}
        onCoverCardSwiped={async () => {}}
        onCertifyDone={async () => {}}
        onDemographicsAnswered={() => {}}
      />
    </DebateSessionProvider>
  );
}

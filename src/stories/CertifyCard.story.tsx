import { useState } from "react";
import { CertifyCard } from "../components/room/CertifyCard";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { mockStatements } from "./mockData";

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
              Prompts anonymous users to verify their phone number. Includes phone entry, code verification, and success states.
            </p>
          </div>
          <div className="max-w-sm">
            <CertifyCardIsolated />
          </div>
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
  const [dismissed, setDismissed] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  if (dismissed) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-muted-foreground">Card dismissed.</p>
        <button
          className="text-sm underline text-primary"
          onClick={() => setDismissed(false)}
        >
          Reset
        </button>
      </div>
    );
  }

  if (succeeded) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-muted-foreground">✅ Verification succeeded — card auto-dismissed.</p>
        <button
          className="text-sm underline text-primary"
          onClick={() => setSucceeded(false)}
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <CertifyCard
      onDismiss={() => setDismissed(true)}
      onSuccess={() => setSucceeded(true)}
    />
  );
}

function CertifyCardInStack() {
  return (
    <SwipeableStatementStack
      statements={mockStatements["debate-with-image"]}
      currentUserId="demo-user"
      allowAnonymous={true}
      isAnonymous={true}
      chanceCardSwiped={true}
      youtubeCardSwiped={true}
      onVote={async () => {}}
      onSubmitStatement={async () => {}}
      onShowAccountSetupModal={() => {}}
      onChanceCardSwiped={async () => {}}
      onYouTubeCardSwiped={async () => {}}
    />
  );
}

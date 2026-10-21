import { useState } from "react";
import { useMotionValue } from "motion/react";
import { Button } from "../components/ui/button";
import { FeedbackCard, FEEDBACK_CARD_SHELL_CLASS } from "../components/room/FeedbackCard";
import { SwipeableStatementStack } from "../components/room/SwipeableStatementStack";
import { DebateSessionProvider } from "../hooks/useDebateSession";
import { useFeedbackCardFlow } from "../hooks/useFeedbackCardFlow";
import type { Statement, UserSession } from "../types";
import {
  getFeedbackStatement,
  type FeedbackStatementKey,
} from "../utils/constants/feedback-statements";
import { mockRooms, mockUser } from "./mockData";
import { StoryContainer } from "./StoryContainer";

const STORY_USER_ID = "story-user";

function CardShell({ statementKey, agreeOpacity = 0 }: { statementKey: FeedbackStatementKey; agreeOpacity?: number }) {
  const disagree = useMotionValue(0);
  const agree = useMotionValue(agreeOpacity);
  const superAgree = useMotionValue(0);
  const pass = useMotionValue(0);

  return (
    <div className="max-w-sm">
      <div className={`relative p-6 rounded-xl border-2 shadow-xl ${FEEDBACK_CARD_SHELL_CLASS}`}>
        <FeedbackCard
          statement={getFeedbackStatement(statementKey)}
          isTopCard={true}
          disagreeOpacity={disagree}
          agreeOpacity={agree}
          superAgreeOpacity={superAgree}
          passOpacity={pass}
          onTellMore={() => console.log("[Story] tell more", statementKey)}
        />
      </div>
    </div>
  );
}

const makeStatement = (id: string, roomId: string, text: string, agrees: number, disagrees: number): Statement => {
  const voters: Statement["voters"] = {};
  for (let i = 0; i < agrees; i++) voters[`${id}-agree-${i}`] = "agree";
  for (let i = 0; i < disagrees; i++) voters[`${id}-disagree-${i}`] = "disagree";
  return {
    id,
    text,
    author: `${id}-agree-0`,
    roomId,
    timestamp: Date.now() - 4 * 60 * 1000,
    agrees,
    superAgrees: 0,
    disagrees,
    passes: 0,
    voters,
    round: 1,
  };
};

const buildStackStatements = (roomId: string): Statement[] => [
  makeStatement("fs1", roomId, "People with white shoes need to clean them", 21, 9),
  makeStatement("fs2", roomId, "Scuffed sneakers have more character", 14, 16),
  makeStatement("fs3", roomId, "A magic eraser is all you need", 18, 5),
];

const anonUser: UserSession = { ...mockUser, id: STORY_USER_ID, isAnonymous: true };
const signedInUser: UserSession = { ...mockUser, id: STORY_USER_ID, isAnonymous: false };

interface StackDemoProps {
  isAnonymous: boolean;
  statementKey: FeedbackStatementKey;
}

function StackDemo({ isAnonymous, statementKey }: StackDemoProps) {
  const [run, setRun] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const overrides = {
    user: isAnonymous ? anonUser : signedInUser,
    anonAddEmailAndLogin: async (email: string) => {
      console.log("[Story] anonAddEmailAndLogin", { email });
      await new Promise((resolve) => setTimeout(resolve, 600));
      return { success: true, data: { requiresOtp: false as const, user: mockUser } };
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={() => { setRun((r) => r + 1); setAnswers([]); }}>
          Reset deck
        </Button>
        <span className="text-sm text-muted-foreground">
          {answers.length ? `Feedback: ${answers.join(", ")}` : "Swipe through to reach the feedback card."}
        </span>
      </div>
      <DebateSessionProvider showcaseOverrides={overrides}>
        <StackWithFeedback
          key={run}
          isAnonymous={isAnonymous}
          statementKey={statementKey}
          onLog={(entry) => setAnswers((prev) => [...prev, entry])}
        />
      </DebateSessionProvider>
    </div>
  );
}

function StackWithFeedback({
  isAnonymous,
  statementKey,
  onLog,
}: StackDemoProps & { onLog: (entry: string) => void }) {
  const [chanceSwiped, setChanceSwiped] = useState(false);
  const room = mockRooms[0];

  const { handleAnswered, handleTellMore, sheets } = useFeedbackCardFlow({
    onVote: (statement, vote) => onLog(`${statement.key} ${vote}`),
    onSendNote: async (statement, text) => {
      console.log("[Story] note", { key: statement.key, text });
      await new Promise((resolve) => setTimeout(resolve, 600));
      onLog(`note on ${statement.key}`);
      return true;
    },
  });

  return (
    <>
      <SwipeableStatementStack
        room={room}
        statements={buildStackStatements(room.id)}
        currentUserId={STORY_USER_ID}
        allowAnonymous={true}
        isAnonymous={isAnonymous}
        chanceCardSwiped={chanceSwiped}
        cover={null}
        coverCardSwiped={true}
        demographicQuestions={[]}
        answeredQuestionIds={new Set()}
        isActive={true}
        onVote={async () => {}}
        onSubmitStatement={async () => {}}
        onShowAccountSetupModal={() => {}}
        onChanceCardSwiped={async () => setChanceSwiped(true)}
        onCoverCardSwiped={async () => {}}
        onCertifyDone={() => {}}
        onDemographicsAnswered={() => {}}
        feedbackStatement={getFeedbackStatement(statementKey)}
        onFeedbackAnswered={handleAnswered}
        onFeedbackTellMore={handleTellMore}
      />
      {sheets}
    </>
  );
}

export function FeedbackCardStory() {
  return (
    <StoryContainer
      title="Feedback Card"
      description="Last card in a deck, asking for feedback on Heard itself. Deep mocha card, amber pill and Inter so it never reads as part of the post."
      variants={[
        { id: "stack-anon", label: "In stack (anon)", children: <StackDemo isAnonymous={true} statementKey="ui_confusing" /> },
        { id: "stack-signed-in", label: "In stack (signed in)", children: <StackDemo isAnonymous={false} statementKey="ui_confusing" /> },
        { id: "founder-anon", label: "Founder card in stack (anon)", children: <StackDemo isAnonymous={true} statementKey="founder_chat" /> },
        { id: "founder-signed-in", label: "Founder card in stack (signed in)", children: <StackDemo isAnonymous={false} statementKey="founder_chat" /> },
        { id: "swiping", label: "Mid-swipe agree", children: <CardShell statementKey="enjoying" agreeOpacity={0.8} /> },
      ]}
    />
  );
}

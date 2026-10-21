import { useState, type ReactNode } from "react";
// @ts-ignore
import { toast } from "sonner@2.0.3";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import { CreatePostFrame } from "../components/create-room/CreatePostFrame";
import { CreatePostShell } from "../components/create-room/CreatePostShell";
import { RantStep } from "../components/create-room/RantStep";
import { ReviewStep } from "../components/create-room/ReviewStep";
import { CreationSuccessStep } from "../components/create-room/CreationSuccessStep";
import { CreateRoomFunnelChart } from "../components/devtools/feature-tracker/CreateRoomFunnelChart";
import type { CreationSetting } from "../components/create-room/CreationSettingsPanel";
import type { Cover, NewDemographicQuestion } from "../types";
import { ONE_WEEK_MIN } from "../utils/time";
import { StoryContainer } from "./StoryContainer";

export default {
  title: "CreateRoom/CreatePostFlow",
};

const PHONE_WIDTH_PX = 375;
const PHONE_HEIGHT_PX = 560;
const MOCK_DELAY_MS = 800;
const MOCK_USER_ID = "story-user";
const MOCK_DEBATE_ID = "story-room-id";

const RANT =
  "People with white shoes need to clean their shoes. If you're going to wear white sneakers you're signing up to keep them white, and a dirty pair looks way worse than any other color.";
const TOPIC = "People with white shoes need to clean their shoes";
const TAKES = [
  "If you wear white shoes, keeping them clean is on you.",
  "Dirty white sneakers look worse than any other dirty shoe.",
  "A little scuffing makes white shoes look better.",
  "I judge people by the state of their shoes.",
];
const LONG_COMMUNITY = "washington-dc-ward-3-neighborhood-commission";
const DEMOGRAPHICS: NewDemographicQuestion[] = [
  { draftId: "d1", type: "age_range" },
  { draftId: "d2", type: "gender" },
];
const HALF_DONE_QUESTION: NewDemographicQuestion[] = [
  { draftId: "c1", type: "custom", text: "Which ward do you live in?", options: ["Ward 1"] },
];
const MOCK_FUNNEL = { opened: 18, reviewed: 9, created: 2, shared: 1 };
const MOCK_COVER: Cover = { type: "image", url: "https://picsum.photos/seed/heard-shoes/600/400" };

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{ width: PHONE_WIDTH_PX, height: PHONE_HEIGHT_PX }}
      className="mx-auto overflow-hidden rounded-[20px] border normal-border shadow-sm"
    >
      {children}
    </div>
  );
}

const noop = () => {};

function RantDemo({ initialRant = "", initialShowExamples = false }: { initialRant?: string; initialShowExamples?: boolean }) {
  const [rant, setRant] = useState(initialRant);
  return (
    <PhoneFrame>
      <CreatePostFrame title="What's got you fired up?" onClose={() => toast("Close")}>
        <RantStep
          rant={rant}
          initialShowExamples={initialShowExamples}
          onRantChange={setRant}
          onContinue={() => toast("Continue")}
          onCreateManually={() => toast("Create post manually")}
        />
      </CreatePostFrame>
    </PhoneFrame>
  );
}

interface ReviewDemoProps {
  topic?: string;
  takes?: string[];
  subHeard?: string;
  hideCommunity?: boolean;
  cover?: Cover | null;
  demographicQuestions?: NewDemographicQuestion[];
  initialOpenSetting?: CreationSetting | null;
}

function ReviewDemo({
  topic: initialTopic = TOPIC,
  takes: initialTakes = TAKES,
  subHeard: initialSubHeard = "test",
  hideCommunity = false,
  cover: initialCover = null,
  demographicQuestions: initialDemographics = [],
  initialOpenSetting = null,
}: ReviewDemoProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [description, setDescription] = useState("");
  const [takes, setTakes] = useState(initialTakes);
  const [subHeard, setSubHeard] = useState(initialSubHeard);
  const [cover, setCover] = useState<Cover | null>(initialCover);
  const [debateLength, setDebateLength] = useState(ONE_WEEK_MIN);
  const [allowAnonymousVoting, setAllowAnonymousVoting] = useState(true);
  const [demographicQuestions, setDemographicQuestions] = useState(initialDemographics);

  return (
    <PhoneFrame>
      <CreatePostFrame title="Review your post" onBack={() => toast("Back")} onClose={() => toast("Close")}>
        <ReviewStep
          topic={topic}
          description={description}
          hotTakes={takes}
          subHeard={subHeard}
          userId={MOCK_USER_ID}
          hideCommunity={hideCommunity}
          cover={cover}
          debateLength={debateLength}
          allowAnonymousVoting={allowAnonymousVoting}
          demographicQuestions={demographicQuestions}
          initialOpenSetting={initialOpenSetting}
          onTopicChange={setTopic}
          onDescriptionChange={setDescription}
          onHotTakesChange={setTakes}
          onSubHeardChange={setSubHeard}
          onImageUpload={(file) => setCover({ type: "image", url: URL.createObjectURL(file) })}
          onCoverChange={setCover}
          onDebateLengthChange={setDebateLength}
          onAllowAnonymousVotingChange={setAllowAnonymousVoting}
          onDemographicQuestionsChange={setDemographicQuestions}
          onCreate={() => toast.success(`Create: "${topic}" in ${subHeard || "(event)"}`)}
        />
      </CreatePostFrame>
    </PhoneFrame>
  );
}

function CreationSuccessDemo() {
  return (
    <PhoneFrame>
      <CreatePostFrame tone="success" onClose={() => toast("Close")}>
        <CreationSuccessStep debateId={MOCK_DEBATE_ID} topic={TOPIC} onViewPost={() => toast("View your post")} />
      </CreatePostFrame>
    </PhoneFrame>
  );
}

type FlowStep = "rant" | "review" | "live";

function FlowSteps({ wrap }: { wrap: (frame: ReactNode) => ReactNode }) {
  const [step, setStep] = useState<FlowStep>("rant");
  const [rant, setRant] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [takes, setTakes] = useState<string[]>([]);
  const [subHeard, setSubHeard] = useState("");
  const [cover, setCover] = useState<Cover | null>(null);
  const [debateLength, setDebateLength] = useState(ONE_WEEK_MIN);
  const [allowAnonymousVoting, setAllowAnonymousVoting] = useState(true);
  const [demographicQuestions, setDemographicQuestions] = useState<NewDemographicQuestion[]>([]);

  const handleContinue = () => {
    setIsExtracting(true);
    setTimeout(() => {
      setTopic(TOPIC);
      setTakes(TAKES.slice(0, 3));
      setIsExtracting(false);
      setStep("review");
    }, MOCK_DELAY_MS);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setTimeout(() => {
      setIsCreating(false);
      setStep("live");
    }, MOCK_DELAY_MS);
  };

  if (step === "live") {
    return wrap(
      <CreatePostFrame tone="success" onClose={() => setStep("rant")}>
        <CreationSuccessStep debateId={MOCK_DEBATE_ID} topic={topic} onViewPost={() => toast("View your post")} />
      </CreatePostFrame>,
    );
  }

  if (step === "review") {
    return wrap(
      <CreatePostFrame title="Review your post" onBack={() => setStep("rant")} onClose={noop}>
        <ReviewStep
          topic={topic}
          description={description}
          hotTakes={takes}
          subHeard={subHeard}
          userId={MOCK_USER_ID}
          cover={cover}
          debateLength={debateLength}
          allowAnonymousVoting={allowAnonymousVoting}
          demographicQuestions={demographicQuestions}
          isCreating={isCreating}
          onTopicChange={setTopic}
          onDescriptionChange={setDescription}
          onHotTakesChange={setTakes}
          onSubHeardChange={setSubHeard}
          onImageUpload={(file) => setCover({ type: "image", url: URL.createObjectURL(file) })}
          onCoverChange={setCover}
          onDebateLengthChange={setDebateLength}
          onAllowAnonymousVotingChange={setAllowAnonymousVoting}
          onDemographicQuestionsChange={setDemographicQuestions}
          onCreate={handleCreate}
        />
      </CreatePostFrame>,
    );
  }

  return wrap(
    <CreatePostFrame title="What's got you fired up?" onClose={noop}>
      <RantStep
        rant={rant}
        isExtracting={isExtracting}
        onRantChange={setRant}
        onContinue={handleContinue}
        onCreateManually={() => {
          setTopic("");
          setTakes([]);
          setStep("review");
        }}
      />
    </CreatePostFrame>,
  );
}

function SheetDemo() {
  const [open, setOpen] = useState(false);
  const [rant, setRant] = useState(RANT);
  return (
    <div className="space-y-3 text-center">
      <p className="text-sm secondary-text">Opens the real full-height sheet. Try it at phone width, and with the keyboard up.</p>
      <Button onClick={() => setOpen(true)}>Open create sheet</Button>
      <CreatePostShell open={open} onOpenChange={setOpen} title="What's got you fired up?">
        <RantStep
          rant={rant}
          onRantChange={setRant}
          onContinue={() => toast("Continue")}
          onCreateManually={() => toast("Create post manually")}
        />
      </CreatePostShell>
    </div>
  );
}

export function CreatePostFlowStory() {
  return (
    <>
      <Toaster />
      <StoryContainer
        title="Create post flow (new)"
        description="The 3-step create flow from the 10/21 mockup, not wired into the app yet. Frames are 375x560, the short-phone size from design-rules.md. Settings icons open their sheets; community loads the real list. Full flow mocks the AI draft and the create call. Half-done custom q: Create post is disabled and Advanced shows an orange ! until the question has text and 2 options; closing Advanced drops a custom question left completely blank."
        variants={[
          { id: "flow", label: "Full flow", children: <FlowSteps wrap={(frame) => <PhoneFrame>{frame}</PhoneFrame>} /> },
          { id: "rant-typed", label: "Rant typed", children: <RantDemo initialRant={RANT} /> },
          { id: "rant-short", label: "Rant too short", children: <RantDemo initialRant="Ugh" /> },
          { id: "rant-ideas", label: "Rant ideas", children: <RantDemo initialShowExamples /> },
          { id: "review", label: "Review", children: <ReviewDemo /> },
          { id: "review-manual", label: "Review manual", children: <ReviewDemo topic="" takes={[]} subHeard="" /> },
          { id: "review-no-community", label: "No community", children: <ReviewDemo subHeard="" /> },
          {
            id: "review-set",
            label: "Cover + demog set",
            children: <ReviewDemo cover={MOCK_COVER} demographicQuestions={DEMOGRAPHICS} />,
          },
          {
            id: "review-incomplete-question",
            label: "Half-done custom q",
            children: <ReviewDemo demographicQuestions={HALF_DONE_QUESTION} />,
          },
          { id: "review-long-community", label: "Long community", children: <ReviewDemo subHeard={LONG_COMMUNITY} /> },
          { id: "review-event", label: "Event (no chip)", children: <ReviewDemo hideCommunity subHeard="" /> },
          { id: "review-advanced", label: "Advanced open", children: <ReviewDemo initialOpenSetting="advanced" /> },
          { id: "review-cover", label: "Cover open", children: <ReviewDemo initialOpenSetting="cover" /> },
          { id: "review-length", label: "Length open", children: <ReviewDemo initialOpenSetting="length" /> },
          { id: "review-community", label: "Community open", children: <ReviewDemo subHeard="" initialOpenSetting="community" /> },
          { id: "success", label: "Success", children: <CreationSuccessDemo /> },
          { id: "sheet", label: "Real sheet", children: <SheetDemo /> },
          { id: "funnel", label: "Tracker funnel", children: <CreateRoomFunnelChart {...MOCK_FUNNEL} /> },
        ]}
      />
    </>
  );
}

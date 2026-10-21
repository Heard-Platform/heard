import { useEffect, useRef, useState } from "react";
// @ts-ignore
import { toast } from "sonner@2.0.3";
import type { Cover, DebateRoom, NewDebateRoom, NewDemographicQuestion } from "../types";
import { api } from "../utils/api";
import { ONE_WEEK_MIN } from "../utils/time";
import { CreatePostShell } from "./create-room/CreatePostShell";
import { RantStep } from "./create-room/RantStep";
import { ReviewStep } from "./create-room/ReviewStep";
import { CreationSuccessStep } from "./create-room/CreationSuccessStep";
import { cleanHotTakes } from "./create-room/create-post-utils";
import {
  extractTopicAndStatements,
  type ExtractedTopicAndStatements,
} from "./create-room/extract-topic-and-statements";

type Step = "rant" | "review" | "success";

const DEV_PREFILL_TAPS = 3;
const DEV_PREFILL_WINDOW_MS = 500;
const DEV_PREFILL = {
  topic: "Should our city invest more in public transportation?",
  description: "A discussion about urban transit investment priorities and how our city should allocate infrastructure spending.",
  hotTakes: [
    "Public transportation reduces traffic congestion and improves air quality",
    "The cost of expanding public transit is too high for our city's budget",
    "Investing in bike lanes would be more cost-effective than buses or trains",
  ],
};

interface CreateRoomSheetNewProps {
  open: boolean;
  defaultSubHeard?: string;
  defaultTopic?: string;
  startInRantMode?: boolean;
  userId: string;
  eventId?: number;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (newDebate: NewDebateRoom) => Promise<DebateRoom>;
  onExtractTopicAndStatements?: (rant: string) => Promise<ExtractedTopicAndStatements>;
  onViewPost?: (room: DebateRoom) => void;
}

export function CreateRoomSheetNew({
  open,
  defaultSubHeard,
  defaultTopic,
  startInRantMode,
  userId,
  eventId,
  onOpenChange,
  onCreateRoom,
  onExtractTopicAndStatements = extractTopicAndStatements,
  onViewPost,
}: CreateRoomSheetNewProps) {
  const [step, setStep] = useState<Step>("rant");
  const [rant, setRant] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [hotTakes, setHotTakes] = useState<string[]>([]);
  const [subHeard, setSubHeard] = useState(defaultSubHeard ?? "");
  const [cover, setCover] = useState<Cover | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [debateLength, setDebateLength] = useState(ONE_WEEK_MIN);
  const [allowAnonymousVoting, setAllowAnonymousVoting] = useState(true);
  const [demographicQuestions, setDemographicQuestions] = useState<NewDemographicQuestion[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<DebateRoom | null>(null);
  const titleTapsRef = useRef({ count: 0, lastTapAt: 0 });

  useEffect(() => {
    if (!open) return;
    setStep(startInRantMode ? "rant" : "review");
    setRant("");
    setTopic(defaultTopic ?? "");
    setDescription("");
    setHotTakes([]);
    setSubHeard(defaultSubHeard ?? "");
    setCover(null);
    setDebateLength(ONE_WEEK_MIN);
    setAllowAnonymousVoting(true);
    setDemographicQuestions([]);
    setCreatedRoom(null);
  }, [open]);

  const handleContinue = async () => {
    setIsExtracting(true);
    try {
      const extracted = await onExtractTopicAndStatements(rant);
      setTopic(extracted.topic);
      setHotTakes(extracted.statements);
      setStep("review");
    } catch (error) {
      console.error("Failed to extract:", error);
      toast.error("Couldn't draft your post. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCreateManually = () => {
    setTopic(defaultTopic ?? "");
    setHotTakes([]);
    setStep("review");
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const result = await api.uploadDebateImage(file);
      if (result.success && result.data?.imageUrl) {
        setCover({ type: "image", url: result.data.imageUrl });
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const room = await onCreateRoom({
        topic: topic.trim(),
        description: description.trim() || undefined,
        subHeard,
        seedStatements: cleanHotTakes(hotTakes),
        cover: cover || undefined,
        allowAnonymous: allowAnonymousVoting,
        debateLength,
        demographicQuestions,
        eventId,
      });
      setCreatedRoom(room);
      setStep("success");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create post. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleViewPost = () => {
    onOpenChange(false);
    if (createdRoom) onViewPost?.(createdRoom);
  };

  const handleTitleTap = () => {
    const now = Date.now();
    const taps = titleTapsRef.current;
    taps.count = now - taps.lastTapAt < DEV_PREFILL_WINDOW_MS ? taps.count + 1 : 1;
    taps.lastTapAt = now;
    if (taps.count < DEV_PREFILL_TAPS) return;
    taps.count = 0;
    setTopic(DEV_PREFILL.topic);
    setDescription(DEV_PREFILL.description);
    setHotTakes(DEV_PREFILL.hotTakes);
    toast.success("Dev mode: Form prefilled!");
  };

  const frameProps =
    step === "success"
      ? { tone: "success" as const }
      : step === "review"
        ? { title: "Review your post", onBack: () => setStep("rant"), onTitleClick: handleTitleTap }
        : { title: "What's got you fired up?" };

  return (
    <CreatePostShell open={open} onOpenChange={onOpenChange} {...frameProps}>
      {step === "rant" && (
        <RantStep
          rant={rant}
          isExtracting={isExtracting}
          onRantChange={setRant}
          onContinue={handleContinue}
          onCreateManually={handleCreateManually}
        />
      )}
      {step === "review" && (
        <ReviewStep
          topic={topic}
          description={description}
          hotTakes={hotTakes}
          subHeard={subHeard}
          defaultSubHeard={defaultSubHeard}
          userId={userId}
          hideCommunity={!!eventId}
          cover={cover}
          isUploadingImage={isUploadingImage}
          debateLength={debateLength}
          allowAnonymousVoting={allowAnonymousVoting}
          demographicQuestions={demographicQuestions}
          isCreating={isCreating}
          onTopicChange={setTopic}
          onDescriptionChange={setDescription}
          onHotTakesChange={setHotTakes}
          onSubHeardChange={setSubHeard}
          onImageUpload={handleImageUpload}
          onCoverChange={setCover}
          onDebateLengthChange={setDebateLength}
          onAllowAnonymousVotingChange={setAllowAnonymousVoting}
          onDemographicQuestionsChange={setDemographicQuestions}
          onCreate={handleCreate}
        />
      )}
      {step === "success" && createdRoom && (
        <CreationSuccessStep debateId={createdRoom.id} topic={createdRoom.topic} onViewPost={handleViewPost} />
      )}
    </CreatePostShell>
  );
}

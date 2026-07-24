import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Hash,
  Sparkles,
  Wand2,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import {
  type NewDebateRoom,
  type DebateRoom,
  type NewDemographicQuestion,
  type Cover,
} from "../types";
import { FunSheet, FunSheetRef } from "./FunSheet";
import {
  WriteRantStep,
  ReviewExtractionStep,
  SelectCommunityStep,
  ShareDebateStep,
  ComposePostStep,
} from "./create-room";
import { normalizeSubHeardName } from "../utils/subheard";
import { api } from "../utils/api";
import { useTranslation } from "react-i18next";

// @ts-ignore
import { toast } from "sonner@2.0.3";
import { ONE_WEEK_MIN } from "../utils/time";

interface CreateRoomSheetProps {
  open: boolean;
  defaultSubHeard?: string;
  defaultTopic?: string;
  userId: string;
  eventId?: number;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (
    newDebate: NewDebateRoom,
  ) => Promise<DebateRoom>;
  onExtractTopicAndStatements: (rant: string) => Promise<{
    topic: string;
    statements: string[];
  }>;
}

type Step =
  | "compose-post"
  | "write-rant"
  | "review-details"
  | "select-community"
  | "share";

interface ExtractedData {
  topic: string;
  statements: string[];
}

const INITIAL_FORM = {
  currentStep: "compose-post" as Step,
  rant: "",
  extractedData: null as ExtractedData | null,
  editedTopic: "",
  editedDescription: "",
  editedStatements: [] as string[],
  newSubHeardName: "",
  debateId: null as string | null,
  cover: null as Cover | null,
  allowAnonymousVoting: true,
  demographicQuestions: [] as NewDemographicQuestion[],
  debateLength: ONE_WEEK_MIN,
  showComposeError: false,
  cameFromRantMode: false,
};

export function CreateRoomSheet({
  open,
  defaultSubHeard,
  defaultTopic,
  userId,
  eventId,
  onOpenChange,
  onCreateRoom,
  onExtractTopicAndStatements,
}: CreateRoomSheetProps) {
  const { t } = useTranslation("toast");
  const [currentStep, setCurrentStep] = useState(INITIAL_FORM.currentStep);
  const [rant, setRant] = useState(INITIAL_FORM.rant);
  const [extractedData, setExtractedData] = useState(INITIAL_FORM.extractedData);
  const [editedTopic, setEditedTopic] = useState(INITIAL_FORM.editedTopic);
  const [editedDescription, setEditedDescription] = useState(INITIAL_FORM.editedDescription);
  const [editedStatements, setEditedStatements] = useState(INITIAL_FORM.editedStatements);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [subHeard, setSubHeard] = useState(defaultSubHeard || "");
  const [newSubHeardName, setNewSubHeardName] = useState(INITIAL_FORM.newSubHeardName);
  const [debateId, setDebateId] = useState(INITIAL_FORM.debateId);
  const [cover, setCover] = useState(INITIAL_FORM.cover);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [allowAnonymousVoting, setAllowAnonymousVoting] = useState(INITIAL_FORM.allowAnonymousVoting);
  const [demographicQuestions, setDemographicQuestions] = useState(INITIAL_FORM.demographicQuestions);
  const [debateLength, setDebateLength] = useState(INITIAL_FORM.debateLength);
  const [showComposeError, setShowComposeError] = useState(INITIAL_FORM.showComposeError);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [titleClickTimer, setTitleClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [cameFromRantMode, setCameFromRantMode] = useState(INITIAL_FORM.cameFromRantMode);
  const funSheetRef = useRef<FunSheetRef>(null);

  const isRantValid = rant.trim().length >= 50;
  const remainingChars = 50 - rant.trim().length;

  // Update subHeard when defaultSubHeard changes
  useEffect(() => {
    if (defaultSubHeard) {
      setSubHeard(defaultSubHeard);
    }
  }, [defaultSubHeard]);

  useEffect(() => {
    funSheetRef.current?.scrollToTop();
  }, [currentStep]);

  const resetForm = useCallback(() => {
    setCurrentStep(INITIAL_FORM.currentStep);
    setRant(INITIAL_FORM.rant);
    setExtractedData(INITIAL_FORM.extractedData);
    setEditedTopic(INITIAL_FORM.editedTopic);
    setEditedDescription(INITIAL_FORM.editedDescription);
    setEditedStatements(INITIAL_FORM.editedStatements);
    setSubHeard(defaultSubHeard || "");
    setNewSubHeardName(INITIAL_FORM.newSubHeardName);
    setDebateId(INITIAL_FORM.debateId);
    setCover(INITIAL_FORM.cover);
    setAllowAnonymousVoting(INITIAL_FORM.allowAnonymousVoting);
    setDemographicQuestions(INITIAL_FORM.demographicQuestions);
    setDebateLength(INITIAL_FORM.debateLength);
    setShowComposeError(INITIAL_FORM.showComposeError);
    setCameFromRantMode(INITIAL_FORM.cameFromRantMode);
  }, [defaultSubHeard]);

  const handleOpen = useCallback(() => {
    resetForm();
    if (defaultTopic) {
      setEditedTopic(defaultTopic);
    }
  }, [resetForm, defaultTopic]);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) handleOpen();
  }, [open]);

  const handleExtractClick = async () => {
    if (!isRantValid || isExtracting) return;

    setIsExtracting(true);
    setCameFromRantMode(true);
    try {
      const extracted = await onExtractTopicAndStatements(rant);
      setExtractedData(extracted);
      setEditedTopic(extracted.topic);
      setEditedStatements(extracted.statements);
      setCurrentStep("review-details");
    } catch (error) {
      console.error("Failed to extract:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProceedToSubHeard = () => {
    setCurrentStep("select-community");
  };

  const handleBackToCompose = () => {
    setCurrentStep("compose-post");
    setCameFromRantMode(false);
  };

  const handleBackToRant = () => {
    setCurrentStep("write-rant");
  };

  const handleBackToReview = () => {
    setCurrentStep("review-details");
  };

  const handleCreateRoom = async () => {
    if (!editedTopic.trim() || isCreating || !subHeard) return;

    setIsCreating(true);
    try {
      const communityName =
        subHeard === "create-new" && newSubHeardName.trim()
          ? normalizeSubHeardName(newSubHeardName)
          : subHeard;

      const result = await onCreateRoom({
        topic: editedTopic.trim(),
        description: editedDescription.trim() || undefined,
        subHeard: communityName,
        seedStatements: editedStatements,
        cover: cover || undefined,
        allowAnonymous: allowAnonymousVoting,
        debateLength,
        demographicQuestions,
        eventId,
      });

      setDebateId(result.id);
      setCurrentStep("share");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("createRoomFailed"),
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const result = await api.uploadDebateImage(file);
      if (result.success && result.data?.imageUrl) {
        setCover({ type: "image", url: result.data.imageUrl });
        toast.success(t("imageUploaded"));
      } else {
        toast.error(result.error || t("imageUploadFailed"));
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(t("imageUploadFailed"));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const handleComposePostProceed = () => {
    if (!editedTopic.trim() || editedStatements.length < 1) {
      setShowComposeError(true);
      return;
    }
    setShowComposeError(false);
    setCameFromRantMode(false);
    setCurrentStep("review-details");
  };

  const handleTitleClick = () => {
    if (currentStep !== "compose-post") return;

    if (titleClickTimer) {
      clearTimeout(titleClickTimer);
    }

    const newCount = titleClickCount + 1;
    setTitleClickCount(newCount);

    if (newCount === 3) {
      setEditedTopic("Should our city invest more in public transportation?");
      setEditedDescription("A discussion about urban transit investment priorities and how our city should allocate infrastructure spending.");
      setEditedStatements([
        "Public transportation reduces traffic congestion and improves air quality",
        "The cost of expanding public transit is too high for our city's budget",
        "Investing in bike lanes would be more cost-effective than buses or trains",
      ]);
      toast.success("Dev mode: Form prefilled!");
      setTitleClickCount(0);
      setTitleClickTimer(null);
    } else {
      const timer = setTimeout(() => {
        setTitleClickCount(0);
        setTitleClickTimer(null);
      }, 500);
      setTitleClickTimer(timer);
    }
  };

  // Determine sheet props based on current step
  const getSheetProps = () => {
    switch (currentStep) {
      case "compose-post":
        return {
          title: "New Conversation",
          description: "What do you want to talk about?",
          leftIcon: Sparkles,
          theme: "green" as const,
          buttonText: "Continue →",
          buttonIcon: Sparkles,
          onButtonClick: handleComposePostProceed,
          buttonDisabled: false,
          showBackButton: false,
        };
      case "write-rant":
        return {
          title: "Start with a Rant",
          description:
            "Let it all out! We'll help you turn it into a structured discussion.",
          leftIcon: Sparkles,
          theme: "green" as const,
          buttonText: isExtracting
            ? "Working on it..."
            : "Continue →",
          buttonLoadingText: "Working on it...",
          buttonIcon: Wand2,
          onButtonClick: handleExtractClick,
          buttonDisabled: !isRantValid || isExtracting,
          isLoading: isExtracting,
          showBackButton: true,
          backButtonText: "Back to Compose",
          onBackClick: () => handleBackToCompose(),
        };
      case "review-details":
        return {
          title: cameFromRantMode ? "Review & Edit" : "Add Details",
          description: cameFromRantMode
            ? "Look good? Edit anything that needs tweaking."
            : "Add any additional details to your post.",
          leftIcon: CheckCircle2,
          theme: "blue" as const,
          ...(eventId ? {
            buttonText: "Create Post! 🚀",
            buttonLoadingText: "Creating...",
            buttonIcon: Plus,
            onButtonClick: handleCreateRoom,
            isLoading: isCreating,
          } : {
            buttonText: "Choose Community →",
            buttonIcon: Hash,
            onButtonClick: handleProceedToSubHeard,
          }),
          buttonDisabled:
            !editedTopic.trim() ||
            editedStatements.length === 0 ||
            (!!eventId && isCreating),
          showBackButton: true,
          backButtonText: cameFromRantMode ? "Back to Rant" : "Back to Compose",
          onBackClick: cameFromRantMode ? handleBackToRant : handleBackToCompose,
        };
      case "select-community":
        return {
          title: "Pick a Community",
          description: "Where should this post live?",
          leftIcon: Hash,
          theme: "purple" as const,
          buttonText: "Create Post! 🚀",
          buttonLoadingText: "Creating...",
          buttonIcon: Plus,
          onButtonClick: handleCreateRoom,
          buttonDisabled:
            !subHeard ||
            (subHeard === "create-new" &&
              !newSubHeardName.trim()) ||
            isCreating,
          isLoading: isCreating,
          showBackButton: true,
          backButtonText: "Back to Details",
          onBackClick: handleBackToReview,
        };
      case "share":
        return {
          title: "Share Your Conversation",
          description: "Spread the word about your new post!",
          leftIcon: PartyPopper,
          theme: "orange" as const,
          buttonText: "Let's Go! 🔥",
          buttonLoadingText: "Closing...",
          buttonIcon: Plus,
          onButtonClick: () => onOpenChange(false),
          buttonDisabled: false,
          isLoading: false,
          showBackButton: false,
        };
    }
  };

  const sheetProps = getSheetProps();

  return (
    <FunSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={sheetProps.title}
      description={sheetProps.description}
      leftIcon={sheetProps.leftIcon}
      theme={sheetProps.theme}
      buttonText={sheetProps.buttonText}
      buttonLoadingText={sheetProps.buttonLoadingText}
      buttonIcon={sheetProps.buttonIcon}
      onButtonClick={sheetProps.onButtonClick}
      buttonDisabled={sheetProps.buttonDisabled}
      isLoading={sheetProps.isLoading}
      showBackButton={sheetProps.showBackButton}
      backButtonText={sheetProps.backButtonText}
      onBackClick={sheetProps.onBackClick}
      onTitleClick={handleTitleClick}
      ref={funSheetRef}
    >
      {currentStep === "compose-post" && (
        <ComposePostStep
          topic={editedTopic}
          description={editedDescription}
          statements={editedStatements}
          onTopicChange={setEditedTopic}
          onDescriptionChange={setEditedDescription}
          onStatementsChange={setEditedStatements}
          onSwitchToRantMode={() => setCurrentStep("write-rant")}
          showError={showComposeError}
        />
      )}

      {currentStep === "write-rant" && (
        <WriteRantStep
          rant={rant}
          isRantValid={isRantValid}
          remainingChars={remainingChars}
          onRantChange={setRant}
        />
      )}

      {currentStep === "review-details" && (
        <ReviewExtractionStep
          topic={editedTopic}
          description={editedDescription}
          statements={editedStatements}
          cover={cover}
          isUploadingImage={isUploadingImage}
          debateLength={debateLength}
          allowAnonymousVoting={allowAnonymousVoting}
          demographicQuestions={demographicQuestions}
          hideTopicAndStatements={!cameFromRantMode}
          onTopicChange={setEditedTopic}
          onDescriptionChange={setEditedDescription}
          onStatementsChange={setEditedStatements}
          onImageUpload={handleImageUpload}
          onCoverChange={setCover}
          onDebateLengthChange={setDebateLength}
          onAllowAnonymousVotingChange={setAllowAnonymousVoting}
          onDemographicQuestionsChange={setDemographicQuestions}
        />
      )}

      {currentStep === "select-community" && (
        <SelectCommunityStep
          subHeard={subHeard}
          defaultSubHeard={defaultSubHeard}
          userId={userId}
          onSubHeardChange={(value) => {
            setSubHeard(value);
          }}
        />
      )}

      {currentStep === "share" && debateId && (
        <ShareDebateStep
          debateId={debateId}
          topic={editedTopic}
        />
      )}
    </FunSheet>
  );
}
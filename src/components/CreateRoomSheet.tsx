import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Hash,
  Sparkles,
  Wand2,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import type { NewDebateRoom, DebateRoom } from "../types";
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
import { convertImageToJPEG, shouldConvertImage } from "../utils/image-converter";

// @ts-ignore
import { toast } from "sonner@2.0.3";
import { ONE_WEEK_MIN } from "../utils/time";

interface CreateRoomSheetProps {
  open: boolean;
  defaultSubHeard?: string;
  defaultTopic?: string;
  userId: string;
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

export function CreateRoomSheet({
  open,
  defaultSubHeard,
  defaultTopic,
  userId,
  onOpenChange,
  onCreateRoom,
  onExtractTopicAndStatements,
}: CreateRoomSheetProps) {
  const [currentStep, setCurrentStep] =
    useState<Step>("write-rant");
  const [rant, setRant] = useState("");
  const [extractedData, setExtractedData] =
    useState<ExtractedData | null>(null);
  const [editedTopic, setEditedTopic] = useState("");
  const [editedStatements, setEditedStatements] = useState<
    string[]
  >([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [subHeard, setSubHeard] = useState(
    defaultSubHeard || "",
  );
  const [newSubHeardName, setNewSubHeardName] = useState("");
  const [debateId, setDebateId] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [allowAnonymousVoting, setAllowAnonymousVoting] = useState(false);
  const [debateLength, setDebateLength] = useState(ONE_WEEK_MIN);
  const [showComposeError, setShowComposeError] = useState(false);
  const [titleClickCount, setTitleClickCount] = useState(0);
  const [titleClickTimer, setTitleClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [cameFromRantMode, setCameFromRantMode] = useState(false);
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
    if (defaultTopic && open) {
      setEditedTopic(defaultTopic);
    }
  }, [defaultTopic, open]);

  useEffect(() => {
    funSheetRef.current?.scrollToTop();
  }, [currentStep]);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep("compose-post");
      if (!defaultTopic) {
        setRant("");
        setEditedTopic("");
        setEditedStatements([]);
      }
      setExtractedData(null);
      setUploadedImageUrl(null);
      setYoutubeUrl("");
    }
  }, [open, defaultTopic]);

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
        subHeard: communityName,
        seedStatements: editedStatements,
        imageUrl: uploadedImageUrl || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined,
        allowAnonymous: allowAnonymousVoting,
        debateLength,
      });

      setDebateId(result.id);
      setCurrentStep("share");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create post. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      let fileToUpload = file;
      
      if (shouldConvertImage(file)) {
        fileToUpload = await convertImageToJPEG(file);
      }
      
      const result = await api.uploadDebateImage(fileToUpload);
      if (result.success && result.data?.imageUrl) {
        setUploadedImageUrl(result.data.imageUrl);
        toast.success("Image uploaded!");
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep("compose-post");
      setRant("");
      setEditedTopic("");
      setEditedStatements([]);
      setExtractedData(null);
      setNewSubHeardName("");
      setDebateId(null);
      setSubHeard(defaultSubHeard || "");
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
          title: "Create a New Post",
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
          buttonText: "Choose Community →",
          buttonIcon: Hash,
          onButtonClick: handleProceedToSubHeard,
          buttonDisabled:
            !editedTopic.trim() ||
            editedStatements.length === 0,
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
          statements={editedStatements}
          onTopicChange={setEditedTopic}
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
          statements={editedStatements}
          isUploadingImage={isUploadingImage}
          uploadedImageUrl={uploadedImageUrl}
          youtubeUrl={youtubeUrl}
          debateLength={debateLength}
          allowAnonymousVoting={allowAnonymousVoting}
          demographicQuestions={[]}
          hideTopicAndStatements={!cameFromRantMode}
          onTopicChange={setEditedTopic}
          onStatementsChange={setEditedStatements}
          onImageUpload={handleImageUpload}
          onYoutubeUrlChange={setYoutubeUrl}
          onDebateLengthChange={setDebateLength}
          onAllowAnonymousVotingChange={setAllowAnonymousVoting}
          onDemographicQuestionsChange={() => {}}
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
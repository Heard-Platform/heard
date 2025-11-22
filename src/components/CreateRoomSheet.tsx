import { useState, useEffect } from "react";
import {
  Plus,
  Hash,
  Sparkles,
  Wand2,
  CheckCircle2,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import type { NewDebateRoom, DebateRoom } from "../types";
import { FunSheet } from "./FunSheet";
import {
  WriteRantStep,
  ReviewExtractionStep,
  SelectCommunityStep,
  ShareDebateStep,
} from "./create-room";
import { normalizeSubHeardName } from "../utils/subheard";
import { api } from "../utils/api";

interface CreateRoomSheetProps {
  open: boolean;
  defaultSubHeard?: string;
  defaultTopic?: string;
  userId?: string;
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
  | "write-rant"
  | "review-extraction"
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

  const isRantValid = rant.trim().length >= 50;
  const remainingChars = 50 - rant.trim().length;

  // Update subHeard when defaultSubHeard changes
  useEffect(() => {
    if (defaultSubHeard) {
      setSubHeard(defaultSubHeard);
    }
  }, [defaultSubHeard]);

  // Prefill rant when defaultTopic is provided
  useEffect(() => {
    if (defaultTopic && open) {
      setRant(defaultTopic);
    }
  }, [defaultTopic, open]);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep("write-rant");
      // Only reset if there's no defaultTopic
      if (!defaultTopic) {
        setRant("");
      }
      setExtractedData(null);
      setEditedTopic("");
      setEditedStatements([]);
      setUploadedImageUrl(null);
    }
  }, [open, defaultTopic]);

  const handleExtractClick = async () => {
    if (!isRantValid || isExtracting) return;

    setIsExtracting(true);
    try {
      const extracted = await onExtractTopicAndStatements(rant);
      setExtractedData(extracted);
      setEditedTopic(extracted.topic);
      setEditedStatements(extracted.statements);
      setCurrentStep("review-extraction");
    } catch (error) {
      console.error("Failed to extract:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProceedToSubHeard = () => {
    setCurrentStep("select-community");
  };

  const handleBackToRant = () => {
    setCurrentStep("write-rant");
  };

  const handleBackToReview = () => {
    setCurrentStep("review-extraction");
  };

  const handleCreateRoom = async () => {
    if (!editedTopic.trim() || isCreating || !subHeard) return;

    setIsCreating(true);
    try {
      // Resolve the community name: use custom name if creating new, otherwise use selected
      const communityName =
        subHeard === "create-new" && newSubHeardName.trim()
          ? normalizeSubHeardName(newSubHeardName)
          : subHeard;

      const result = await onCreateRoom({
        topic: editedTopic.trim(),
        subHeard: communityName,
        seedStatements: editedStatements,
        imageUrl: uploadedImageUrl || undefined,
      });

      setDebateId(result.id);
      setCurrentStep("share");
    } catch (error) {
      console.error("Failed to create room:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create debate. Please try again.",
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
      // Reset everything when closing
      setCurrentStep("write-rant");
      setRant("");
      setExtractedData(null);
      setNewSubHeardName("");
      setDebateId(null);
      setSubHeard(defaultSubHeard || "");
    }
    onOpenChange(isOpen);
  };

  // Determine sheet props based on current step
  const getSheetProps = () => {
    switch (currentStep) {
      case "write-rant":
        return {
          title: "Start with a Rant",
          description:
            "Let it all out! We'll turn it into a structured debate.",
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
          showBackButton: false,
        };
      case "review-extraction":
        return {
          title: "Review & Edit",
          description:
            "Look good? Edit anything that needs tweaking.",
          leftIcon: CheckCircle2,
          theme: "blue" as const,
          buttonText: "Choose Community →",
          buttonLoadingText: "Loading...",
          buttonIcon: Hash,
          onButtonClick: handleProceedToSubHeard,
          buttonDisabled:
            !editedTopic.trim() ||
            editedStatements.length === 0,
          isLoading: false,
          showBackButton: true,
          backButtonText: "Back to Rant",
          onBackClick: handleBackToRant,
        };
      case "select-community":
        return {
          title: "Pick a Community",
          description: "Where should this debate live?",
          leftIcon: Hash,
          theme: "purple" as const,
          buttonText: "Create Debate! 🚀",
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
          backButtonText: "Back to Review",
          onBackClick: handleBackToReview,
        };
      case "share":
        return {
          title: "Share Your Debate",
          description: "Spread the word about your new debate!",
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
    >
      {currentStep === "write-rant" && (
        <WriteRantStep
          rant={rant}
          isRantValid={isRantValid}
          remainingChars={remainingChars}
          onRantChange={setRant}
        />
      )}

      {currentStep === "review-extraction" && (
        <ReviewExtractionStep
          topic={editedTopic}
          statements={editedStatements}
          isUploadingImage={isUploadingImage}
          uploadedImageUrl={uploadedImageUrl}
          onTopicChange={setEditedTopic}
          onStatementsChange={setEditedStatements}
          onImageUpload={handleImageUpload}
        />
      )}

      {currentStep === "select-community" && (
        <SelectCommunityStep
          subHeard={subHeard}
          newSubHeardName={newSubHeardName}
          defaultSubHeard={defaultSubHeard}
          userId={userId}
          onSubHeardChange={(value) => {
            setSubHeard(value);
            if (value !== "create-new") {
              setNewSubHeardName("");
            }
          }}
          onNewSubHeardNameChange={setNewSubHeardName}
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
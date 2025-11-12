import { useState, useEffect } from "react";
import { Plus, Hash, Sparkles, Wand2, CheckCircle2 } from "lucide-react";
import type { DebateMode } from "../types";
import { FunSheet } from "./FunSheet";
import {
  WriteRantStep,
  ReviewExtractionStep,
  SelectCommunityStep,
} from "./create-room";
import { normalizeSubHeardName } from "../utils/subheard";

interface CreateRoomSheetProps {
  open: boolean;
  defaultSubHeard?: string;
  defaultTopic?: string;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (
    topic: string,
    mode: DebateMode,
    rantFirst?: boolean,
    description?: string,
    subHeard?: string,
    seedStatements?: string[] // Add seed statements parameter
  ) => Promise<void>;
  onExtractTopicAndStatements: (rant: string) => Promise<{
    topic: string;
    statements: string[];
  }>;
}

type Step = "write-rant" | "review-extraction" | "select-community";

interface ExtractedData {
  topic: string;
  statements: string[];
}

export function CreateRoomSheet({
  open,
  defaultSubHeard,
  defaultTopic,
  onOpenChange,
  onCreateRoom,
  onExtractTopicAndStatements,
}: CreateRoomSheetProps) {
  const [currentStep, setCurrentStep] = useState<Step>("write-rant");
  const [rant, setRant] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editedTopic, setEditedTopic] = useState("");
  const [editedStatements, setEditedStatements] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [subHeard, setSubHeard] = useState(defaultSubHeard || "");
  const [newSubHeardName, setNewSubHeardName] = useState("");

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
      const communityName = subHeard === "create-new" && newSubHeardName.trim()
        ? normalizeSubHeardName(newSubHeardName)
        : subHeard;

      await onCreateRoom(
        editedTopic.trim(),
        "realtime", // Always use realtime mode
        true, // Always enable rant-first mode
        editedStatements.join("\n\n"), // Pass extracted statements as description for now
        communityName,
        editedStatements // Add seed statements
      );

      // Reset form
      setCurrentStep("write-rant");
      setRant("");
      setExtractedData(null);
      setNewSubHeardName("");
      setSubHeard(defaultSubHeard || "");
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset everything when closing
      setCurrentStep("write-rant");
      setRant("");
      setExtractedData(null);
      setNewSubHeardName("");
    }
    onOpenChange(isOpen);
  };

  // Determine sheet props based on current step
  const getSheetProps = () => {
    switch (currentStep) {
      case "write-rant":
        return {
          title: "Start with a Rant",
          description: "Let it all out! We'll turn it into a structured debate.",
          leftIcon: Sparkles,
          theme: "green" as const,
          buttonText: isExtracting ? "Working on it..." : "Continue →",
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
          description: "Look good? Edit anything that needs tweaking.",
          leftIcon: CheckCircle2,
          theme: "blue" as const,
          buttonText: "Choose Community →",
          buttonLoadingText: "Loading...",
          buttonIcon: Hash,
          onButtonClick: handleProceedToSubHeard,
          buttonDisabled: !editedTopic.trim() || editedStatements.length === 0,
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
          buttonDisabled: !subHeard || (subHeard === "create-new" && !newSubHeardName.trim()) || isCreating,
          isLoading: isCreating,
          showBackButton: true,
          backButtonText: "Back to Review",
          onBackClick: handleBackToReview,
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
          onTopicChange={setEditedTopic}
          onStatementsChange={setEditedStatements}
        />
      )}

      {currentStep === "select-community" && (
        <SelectCommunityStep
          subHeard={subHeard}
          newSubHeardName={newSubHeardName}
          defaultSubHeard={defaultSubHeard}
          onSubHeardChange={(value) => {
            setSubHeard(value);
            if (value !== "create-new") {
              setNewSubHeardName("");
            }
          }}
          onNewSubHeardNameChange={setNewSubHeardName}
        />
      )}
    </FunSheet>
  );
}
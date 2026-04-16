import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Hash,
  Plus,
  PartyPopper,
} from "lucide-react";
import { FunSheet, FunSheetRef } from "./FunSheet";
import { SelectCommunityStep } from "./create-room";
import { EventDetailsStep } from "./create-event/EventDetailsStep";
import { EventCreatedStep } from "./create-event/EventCreatedStep";
import { api } from "../utils/api";
import type { Event } from "../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface CreateEventSheetProps {
  open: boolean;
  userId: string;
  defaultSubHeard?: string;
  onOpenChange: (open: boolean) => void;
  onEventCreated?: (event: Event) => void;
  onGoToEvent?: (eventId: string) => void;
}

type Step = "event-details" | "select-community" | "done";

export function CreateEventSheet({
  open,
  userId,
  defaultSubHeard,
  onOpenChange,
  onEventCreated,
  onGoToEvent,
}: CreateEventSheetProps) {
  const [currentStep, setCurrentStep] = useState<Step>("event-details");
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [community, setCommunity] = useState(defaultSubHeard || "");
  const [newCommunityName, setNewCommunityName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const funSheetRef = useRef<FunSheetRef>(null);

  useEffect(() => {
    if (defaultSubHeard) {
      setCommunity(defaultSubHeard);
    }
  }, [defaultSubHeard]);

  useEffect(() => {
    funSheetRef.current?.scrollToTop();
  }, [currentStep]);

  useEffect(() => {
    if (open) {
      setCurrentStep("event-details");
      setName("");
      setSubtitle("");
      setCommunity(defaultSubHeard || "");
      setNewCommunityName("");
      setCreatedEvent(null);
      setShowNameError(false);
    }
  }, [open, defaultSubHeard]);

  const handleProceedToCommunity = () => {
    if (!name.trim()) {
      setShowNameError(true);
      return;
    }
    setShowNameError(false);
    setCurrentStep("select-community");
  };

  const handleCreateEvent = async () => {
    if (!name.trim() || isCreating || !community) return;

    setIsCreating(true);
    try {
      const communityName =
        community === "create-new" && newCommunityName.trim()
          ? newCommunityName.trim().toLowerCase().replace(/\s+/g, "-")
          : community;

      const result = await api.createEvent({
        name: name.trim(),
        subtitle: subtitle.trim(),
        communityName: communityName,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create event");
      }

      setCreatedEvent(result.data.event);
      onEventCreated?.(result.data.event);
      setCurrentStep("done");
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create event. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCurrentStep("event-details");
      setName("");
      setSubtitle("");
      setCommunity(defaultSubHeard || "");
      setNewCommunityName("");
      setCreatedEvent(null);
      setShowNameError(false);
    }
    onOpenChange(isOpen);
  };

  const getSheetProps = () => {
    switch (currentStep) {
      case "event-details":
        return {
          title: "New Event",
          description: "What are you organizing?",
          leftIcon: Calendar,
          theme: "orange" as const,
          buttonText: "Choose Community →",
          buttonIcon: Hash,
          onButtonClick: handleProceedToCommunity,
          buttonDisabled: false,
          showBackButton: false,
        };
      case "select-community":
        return {
          title: "Pick a Community",
          description: "Where should this event live?",
          leftIcon: Hash,
          theme: "purple" as const,
          buttonText: "Create Event! 🎉",
          buttonLoadingText: "Creating...",
          buttonIcon: Plus,
          onButtonClick: handleCreateEvent,
          buttonDisabled:
            !community ||
            (community === "create-new" && !newCommunityName.trim()) ||
            isCreating,
          isLoading: isCreating,
          showBackButton: true,
          backButtonText: "Back to Details",
          onBackClick: () => setCurrentStep("event-details"),
        };
      case "done":
        return {
          title: "Event Created!",
          description: "Your event is live.",
          leftIcon: PartyPopper,
          theme: "orange" as const,
          buttonText: "Maybe later",
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
      buttonLoadingText={(sheetProps as any).buttonLoadingText}
      buttonIcon={sheetProps.buttonIcon}
      onButtonClick={sheetProps.onButtonClick}
      buttonDisabled={sheetProps.buttonDisabled}
      isLoading={(sheetProps as any).isLoading}
      showBackButton={sheetProps.showBackButton}
      backButtonText={(sheetProps as any).backButtonText}
      onBackClick={(sheetProps as any).onBackClick}
      ref={funSheetRef}
    >
      {currentStep === "event-details" && (
        <EventDetailsStep
          name={name}
          subtitle={subtitle}
          onNameChange={setName}
          onSubtitleChange={setSubtitle}
          showError={showNameError}
        />
      )}

      {currentStep === "select-community" && (
        <SelectCommunityStep
          subHeard={community}
          defaultSubHeard={defaultSubHeard}
          userId={userId}
          onSubHeardChange={(value) => setCommunity(value)}
        />
      )}

      {currentStep === "done" && createdEvent && (
        <EventCreatedStep
          eventName={createdEvent.name}
          onGoToEvent={() => {
            onOpenChange(false);
            onGoToEvent?.(createdEvent.id);
          }}
        />
      )}
    </FunSheet>
  );
}

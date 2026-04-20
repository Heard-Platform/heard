import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Hash,
  MessageSquarePlus,
  PartyPopper,
  Plus,
} from "lucide-react";
import { FunSheet, FunSheetRef } from "./FunSheet";
import { SelectCommunityStep } from "./create-room";
import { EventDetailsStep } from "./create-event/EventDetailsStep";
import { EventCreatedStep } from "./create-event/EventCreatedStep";
import { useDebateSession } from "../hooks/useDebateSession";
import type { Event } from "../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface CreateEventSheetProps {
  open: boolean;
  defaultSubHeard?: string;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onGoToEvent: (eventId: string) => void;
}

type Step = "event-details" | "select-community" | "done";

export function CreateEventSheet({
  open,
  defaultSubHeard,
  userId,
  onOpenChange,
  onGoToEvent,
}: CreateEventSheetProps) {
  const { createEvent } = useDebateSession();
  const [currentStep, setCurrentStep] = useState<Step>("event-details");
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [community, setCommunity] = useState(defaultSubHeard || "");
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
      const event = await createEvent({
        name: name.trim(),
        subtitle: subtitle.trim(),
        communityName: community,
      });

      setCreatedEvent(event);
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
          buttonDisabled: false,
          showBackButton: false,
          onButtonClick: handleProceedToCommunity,
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
          buttonDisabled: !community || isCreating,
          isLoading: isCreating,
          showBackButton: true,
          backButtonText: "Back to Details",
          onButtonClick: handleCreateEvent,
          onBackClick: () => setCurrentStep("event-details"),
        };
      case "done":
        return {
          title: "Event Created!",
          description: "Your event is live.",
          leftIcon: PartyPopper,
          theme: "orange" as const,
          buttonText: "Go to event page",
          buttonIcon: MessageSquarePlus,
          buttonDisabled: false,
          isLoading: false,
          showBackButton: false,
          onButtonClick: () => onGoToEvent(createdEvent!.id),
        };
    }
  };

  const sheetProps = getSheetProps();

  return (
    <FunSheet
      ref={funSheetRef}
      open={open}
      title={sheetProps.title}
      description={sheetProps.description}
      leftIcon={sheetProps.leftIcon}
      theme={sheetProps.theme}
      buttonText={sheetProps.buttonText}
      buttonLoadingText={(sheetProps as any).buttonLoadingText}
      buttonIcon={sheetProps.buttonIcon}
      buttonDisabled={sheetProps.buttonDisabled}
      isLoading={(sheetProps as any).isLoading}
      showBackButton={sheetProps.showBackButton}
      backButtonText={(sheetProps as any).backButtonText}
      onOpenChange={handleOpenChange}
      onButtonClick={sheetProps.onButtonClick}
      onBackClick={(sheetProps as any).onBackClick}
    >
      {currentStep === "event-details" && (
        <EventDetailsStep
          name={name}
          subtitle={subtitle}
          showError={showNameError}
          onNameChange={setName}
          onSubtitleChange={setSubtitle}
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
        <EventCreatedStep eventName={createdEvent.name} />
      )}
    </FunSheet>
  );
}

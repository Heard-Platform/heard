import { useState, useEffect } from "react";
import { Calendar, MessageSquarePlus, PartyPopper, Plus } from "lucide-react";
import { FunSheet } from "./FunSheet";
import { EventDetailsStep } from "./create-event/EventDetailsStep";
import { EventCreatedStep } from "./create-event/EventCreatedStep";
import { useDebateSession } from "../hooks/useDebateSession";
import { formatSubHeardDisplay } from "../utils/subheard";
import type { EventSummary } from "../types";

// @ts-ignore
import { toast } from "sonner@2.0.3";

interface CreateEventSheetProps {
  open: boolean;
  communityName: string;
  onOpenChange: (open: boolean) => void;
  onGoToEvent: (eventId: string) => void;
}

export function CreateEventSheet({
  open,
  communityName,
  onOpenChange,
  onGoToEvent,
}: CreateEventSheetProps) {
  const { createEvent } = useDebateSession();
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<EventSummary | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSubtitle("");
      setCreatedEvent(null);
      setShowNameError(false);
    }
  }, [open]);

  const handleCreateEvent = async () => {
    if (isCreating) return;
    if (!name.trim()) {
      setShowNameError(true);
      return;
    }

    setShowNameError(false);
    setIsCreating(true);
    try {
      const event = await createEvent({
        name: name.trim(),
        subtitle: subtitle.trim(),
        communityName,
      });
      setCreatedEvent(event);
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

  const sheetProps = createdEvent
    ? {
        title: "Event Created!",
        description: "Your event is ready.",
        leftIcon: PartyPopper,
        buttonText: "Go to event page",
        buttonIcon: MessageSquarePlus,
        onButtonClick: () => onGoToEvent(String(createdEvent.id)),
      }
    : {
        title: "New Event",
        description: `For ${formatSubHeardDisplay(communityName)}`,
        leftIcon: Calendar,
        buttonText: "Create Event! 🎉",
        buttonIcon: Plus,
        onButtonClick: handleCreateEvent,
      };

  return (
    <FunSheet
      open={open}
      title={sheetProps.title}
      description={sheetProps.description}
      leftIcon={sheetProps.leftIcon}
      theme="orange"
      buttonText={sheetProps.buttonText}
      buttonLoadingText="Creating..."
      buttonIcon={sheetProps.buttonIcon}
      buttonDisabled={isCreating}
      isLoading={isCreating}
      showBackButton={false}
      onOpenChange={onOpenChange}
      onButtonClick={sheetProps.onButtonClick}
    >
      {createdEvent ? (
        <EventCreatedStep eventName={createdEvent.name} />
      ) : (
        <EventDetailsStep
          name={name}
          subtitle={subtitle}
          showError={showNameError}
          onNameChange={setName}
          onSubtitleChange={setSubtitle}
        />
      )}
    </FunSheet>
  );
}

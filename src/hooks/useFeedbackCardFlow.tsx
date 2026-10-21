import { useState } from "react";
import type { VoteType } from "../types";
import type { FeedbackStatement } from "../utils/constants/feedback-statements";
import { FeedbackNoteSheet } from "../components/room/FeedbackNoteSheet";
import { EmailAskSheet, type EmailAskReason } from "../components/room/EmailAskSheet";
import { useDebateSession } from "./useDebateSession";
import { useEmailOtpFlow } from "./useEmailOtpFlow";
import { api } from "../utils/api";

// @ts-ignore
import { toast } from "sonner@2.0.3";

const SHEET_HANDOFF_MS = 350;

interface UseFeedbackCardFlowOptions {
  roomId: string;
  onVote: (statement: FeedbackStatement, vote: VoteType) => void;
  onSendNote: (statement: FeedbackStatement, text: string) => Promise<boolean>;
}

export function useFeedbackCardFlow({ roomId, onVote, onSendNote }: UseFeedbackCardFlowOptions) {
  const { user } = useDebateSession();
  const isAnonymous = !user || !!user.isAnonymous;
  const [noteFor, setNoteFor] = useState<FeedbackStatement | null>(null);
  const [emailReason, setEmailReason] = useState<EmailAskReason | null>(null);

  const emailFlow = useEmailOtpFlow({
    onComplete: () => {
      api.trackEvent(emailReason === "note" ? "feedback_note_signup" : "feedback_founder_signup", roomId);
      setEmailReason(null);
      toast.success("You're all set. Alex will be in touch.");
    },
  });

  const openEmailAsk = (reason: EmailAskReason) => {
    emailFlow.goBackToEmail();
    setEmailReason(reason);
  };

  const handleVoted = (statement: FeedbackStatement, vote: VoteType) => {
    onVote(statement, vote);
    const agreed = vote === "agree" || vote === "super_agree";
    if (statement.key !== "founder_chat" || !agreed) return;
    if (isAnonymous) {
      openEmailAsk("founder");
    } else {
      toast.success("Awesome! Alex will reach out by email.");
    }
  };

  const handleSendNote = async (text: string) => {
    if (!noteFor) return false;
    const saved = await onSendNote(noteFor, text);
    if (!saved) return false;
    api.trackEvent("feedback_note_sent", roomId);
    setNoteFor(null);
    if (isAnonymous) {
      setTimeout(() => openEmailAsk("note"), SHEET_HANDOFF_MS);
    } else {
      toast.success("Thanks! Alex reads every note.");
    }
    return true;
  };

  const sheets = (
    <>
      {noteFor && (
        <FeedbackNoteSheet
          isOpen={true}
          statement={noteFor}
          onSend={handleSendNote}
          onDismiss={() => setNoteFor(null)}
        />
      )}
      <EmailAskSheet
        isOpen={emailReason !== null}
        reason={emailReason ?? "founder"}
        emailFlow={emailFlow}
        onNotNow={() => setEmailReason(null)}
        onDismiss={() => setEmailReason(null)}
      />
    </>
  );

  return { handleVoted, handleTellMore: setNoteFor, sheets };
}

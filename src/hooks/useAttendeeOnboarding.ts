// @ts-ignore
import { toast } from "sonner@2.0.3";
import { useEffect, useRef, useState } from "react";
import type { AttendeeOnboarding } from "../types";
import { api } from "../utils/api";
import {
  FeatureFlags,
  isFeatureEnabled,
} from "../utils/constants/feature-flags";
import { hasUnansweredQuestions } from "../utils/demographic-questions";

const NO_ONBOARDING: AttendeeOnboarding = {
  questions: [],
  answeredQuestionIds: [],
};

const fetchAttendeeOnboarding = async (
  eventId: string,
): Promise<AttendeeOnboarding> => {
  if (!isFeatureEnabled(FeatureFlags.EVENT_ONBOARDING_QUESTIONS)) {
    return NO_ONBOARDING;
  }
  const response = await api.getAttendeeOnboarding(eventId);
  if (!response.success || !response.data) return NO_ONBOARDING;
  return {
    questions: response.data.questions,
    answeredQuestionIds: response.data.answeredQuestionIds,
  };
};

export function useAttendeeOnboarding(
  eventId: string,
  canAnswerQuestions: boolean,
) {
  const [onboarding, setOnboarding] =
    useState<AttendeeOnboarding | null>(null);
  const [hasFinishedOnboarding, setHasFinishedOnboarding] =
    useState(false);
  const onboardingStartedAt = useRef<number | null>(null);

  const isLoadingOnboarding =
    canAnswerQuestions && onboarding === null;
  const isAnsweringQuestions =
    onboarding !== null &&
    !hasFinishedOnboarding &&
    hasUnansweredQuestions(onboarding);
  const loadedOnboarding = onboarding ?? NO_ONBOARDING;

  useEffect(() => {
    if (!canAnswerQuestions) return;
    let cancelled = false;
    fetchAttendeeOnboarding(eventId).then((loaded) => {
      if (!cancelled) setOnboarding(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, canAnswerQuestions]);

  useEffect(() => {
    if (!isAnsweringQuestions) return;
    onboardingStartedAt.current = Date.now();
    api.trackEvent("event_onboarding_started");
  }, [isAnsweringQuestions]);

  const saveAnswer = async (
    questionId: string,
    answers: string[],
  ) => {
    const response = await api.saveEventDemographicAnswer(
      eventId,
      questionId,
      answers,
    );
    if (!response.success) {
      toast.error(response.error || "That answer didn't save.");
    }
  };

  const finishOnboarding = () => {
    const startedAt = onboardingStartedAt.current ?? Date.now();
    api.trackTimedEvent(
      "event_onboarding_finished",
      Date.now() - startedAt,
    );
    setHasFinishedOnboarding(true);
  };

  return {
    questions: loadedOnboarding.questions,
    answeredQuestionIds: loadedOnboarding.answeredQuestionIds,
    isLoadingOnboarding,
    isAnsweringQuestions,
    saveAnswer,
    finishOnboarding,
  };
}

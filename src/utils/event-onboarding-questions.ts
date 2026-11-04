import _ from "lodash";
import type {
  DemographicQuestion,
  EventOnboardingQuestionDraft,
  EventOnboardingQuestionInput,
} from "../types";
import { moveInOrder } from "./live-event";
import { hasDuplicates } from "./validation";

export const EVENT_ONBOARDING_MINIMUM_OPTION_COUNT = 1;

export function toEventOnboardingQuestionDrafts(
  questions: DemographicQuestion[],
): EventOnboardingQuestionDraft[] {
  return questions.map((question) => ({
    draftId: question.id,
    text: question.text ?? "",
    options: question.options ?? [],
    multiSelect: question.multiSelect,
  }));
}

export function createBlankEventOnboardingQuestionDraft(): EventOnboardingQuestionDraft {
  return { draftId: crypto.randomUUID(), text: "", options: ["", ""], multiSelect: false };
}

export function toEventOnboardingQuestionInputs(
  drafts: EventOnboardingQuestionDraft[],
): EventOnboardingQuestionInput[] {
  return drafts.map(({ text, options, multiSelect }) => ({ text, options, multiSelect }));
}

export function isEventOnboardingQuestionDraftComplete(draft: EventOnboardingQuestionDraft): boolean {
  const nonBlankOptions = draft.options.filter((option) => option.trim() !== "");
  return draft.text.trim() !== "" && nonBlankOptions.length >= EVENT_ONBOARDING_MINIMUM_OPTION_COUNT;
}

function hasDuplicateOptions(draft: EventOnboardingQuestionDraft): boolean {
  return draft.options.some((option) => hasDuplicates(option, draft.options));
}

export function isDuplicateQuestionText(
  draft: EventOnboardingQuestionDraft,
  drafts: EventOnboardingQuestionDraft[],
): boolean {
  return hasDuplicates(
    draft.text,
    drafts.map((otherDraft) => otherDraft.text),
  );
}

export function canSaveEventOnboardingQuestions(drafts: EventOnboardingQuestionDraft[]): boolean {
  if (!drafts.every(isEventOnboardingQuestionDraftComplete)) return false;
  if (drafts.some(hasDuplicateOptions)) return false;
  if (drafts.some((draft) => isDuplicateQuestionText(draft, drafts))) return false;
  return true;
}

export function haveEventOnboardingQuestionsChanged(
  drafts: EventOnboardingQuestionDraft[],
  savedDrafts: EventOnboardingQuestionDraft[],
): boolean {
  return !_.isEqual(toEventOnboardingQuestionInputs(drafts), toEventOnboardingQuestionInputs(savedDrafts));
}

export function moveEventOnboardingQuestionDraft(
  drafts: EventOnboardingQuestionDraft[],
  currentIndex: number,
  offset: -1 | 1,
): EventOnboardingQuestionDraft[] {
  const draftsById = _.keyBy(drafts, "draftId");
  const movedDraftIds = moveInOrder(
    drafts.map((draft) => draft.draftId),
    currentIndex,
    offset,
  );
  return movedDraftIds.map((draftId) => draftsById[draftId]);
}

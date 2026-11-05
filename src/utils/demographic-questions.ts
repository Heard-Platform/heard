import type {
  AttendeeOnboarding,
  DemographicQuestion,
} from "../types";

export const OPT_OUT_ANSWER = "Prefer not to say";

export function getOptionsPlusOptOut(question: DemographicQuestion): string[] {
  const options = (question.options ?? []).filter(
    (option) => option !== OPT_OUT_ANSWER,
  );
  return [...options, OPT_OUT_ANSWER];
}

export function toggleMultiSelectAnswer(
  pickedAnswers: string[],
  tappedOption: string,
): string[] {
  const isAlreadyPicked = pickedAnswers.includes(tappedOption);
  if (tappedOption === OPT_OUT_ANSWER) {
    return isAlreadyPicked ? [] : [OPT_OUT_ANSWER];
  }
  const pickedWithoutOptOut = pickedAnswers.filter(
    (answer) => answer !== OPT_OUT_ANSWER,
  );
  if (isAlreadyPicked) {
    return pickedWithoutOptOut.filter((answer) => answer !== tappedOption);
  }
  return [...pickedWithoutOptOut, tappedOption];
}

export function findFirstUnansweredQuestionIndex(
  questions: DemographicQuestion[],
  answeredQuestionIds: string[],
): number {
  const firstUnansweredIndex = questions.findIndex(
    (question) => !answeredQuestionIds.includes(question.id),
  );
  return firstUnansweredIndex === -1 ? questions.length : firstUnansweredIndex;
}

export function hasUnansweredQuestions(
  onboarding: AttendeeOnboarding,
): boolean {
  const firstUnansweredIndex = findFirstUnansweredQuestionIndex(
    onboarding.questions,
    onboarding.answeredQuestionIds,
  );
  return firstUnansweredIndex < onboarding.questions.length;
}

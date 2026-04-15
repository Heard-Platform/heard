import { DemographicBreakdown } from "./analysis-utils.tsx";
import { DemographicQuestion, DemographicAnswer } from "./types.tsx";
import _ from "lodash";

export function calcDemographicBreakdown(
  questions: DemographicQuestion[],
  answers: DemographicAnswer[],
): DemographicBreakdown {
  const questionMap = _.keyBy(questions, 'id');
  const answersWithQuestions = answers.map(answer => ({
    ...answer,
    answer: answer.answer ?? "Not answered",
    question: questionMap[answer.questionId],
  }));

  type GroupedAnswer = DemographicAnswer & { question: DemographicQuestion };

  const answersGroupedByQuestion = _.groupBy(answersWithQuestions,
    (answer: GroupedAnswer) =>
      answer.question.type === 'custom' ? answer.question.text : answer.question.type
  );

  const breakdown = _.mapValues(answersGroupedByQuestion, (group: GroupedAnswer[]) => {
    const total = group.length;
    const optionCounts = _.countBy(group, 'answer');
    const optionPercentages = _.mapValues(
      optionCounts,
      (count: number) => (count / total),
    );
    return optionPercentages;
  });

  return breakdown;
}
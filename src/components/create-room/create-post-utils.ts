import _ from "lodash";
import { isCustomDemographicQuestion, type NewDemographicQuestion } from "../../types";

export const MIN_TOPIC_LENGTH = 5;
export const MIN_RANT_LENGTH = 5;
export const MAX_RANT_LENGTH = 2000;
export const MIN_CUSTOM_QUESTION_OPTIONS = 2;

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

export function formatDebateLengthShort(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) return `${Math.max(1, Math.round(minutes))}m`;
  if (minutes < MINUTES_PER_DAY) return `${Math.round(minutes / MINUTES_PER_HOUR)}h`;
  return `${Math.round(minutes / MINUTES_PER_DAY)}d`;
}

export function addHotTake(takes: string[], text: string): string[] {
  const trimmed = text.trim();
  return trimmed ? [...takes, trimmed] : takes;
}

export function updateHotTake(takes: string[], index: number, text: string): string[] {
  return takes.map((take, i) => (i === index ? text : take));
}

export function removeHotTake(takes: string[], index: number): string[] {
  return takes.filter((_take, i) => i !== index);
}

const nonBlankTrimmed = (items: string[]) => _.chain(items).map(_.trim).compact().value();

export function cleanHotTakes(takes: string[]): string[] {
  return nonBlankTrimmed(takes);
}

interface CanCreatePostInput {
  topic: string;
  hotTakes: string[];
  subHeard: string;
  needsCommunity: boolean;
}

export function canCreatePost({ topic, hotTakes, subHeard, needsCommunity }: CanCreatePostInput): boolean {
  if (topic.trim().length < MIN_TOPIC_LENGTH) return false;
  if (cleanHotTakes(hotTakes).length === 0) return false;
  if (needsCommunity && !subHeard.trim()) return false;
  return true;
}

export function hasIncompleteCustomQuestion(questions: NewDemographicQuestion[]): boolean {
  return _.some(
    questions,
    (q) =>
      isCustomDemographicQuestion(q) &&
      (!q.text.trim() || nonBlankTrimmed(q.options).length < MIN_CUSTOM_QUESTION_OPTIONS),
  );
}

export function dropBlankCustomQuestions(questions: NewDemographicQuestion[]): NewDemographicQuestion[] {
  return _.reject(
    questions,
    (q) => isCustomDemographicQuestion(q) && !q.text.trim() && nonBlankTrimmed(q.options).length === 0,
  );
}

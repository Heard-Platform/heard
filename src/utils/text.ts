export const pluralizePerson = (count: number): string =>
  count === 1 ? "person" : "people";

export const pluralizeStatement = (count: number): string =>
  count === 1 ? "statement" : "statements";

export const pluralizeQuestion = (count: number): string =>
  count === 1 ? "question" : "questions";

export const pluralizeMinute = (count: number): string =>
  count === 1 ? "minute" : "minutes";

export const pluralizeVote = (count: number): string =>
  count === 1 ? "vote" : "votes";

export const pluralizePrompt = (count: number): string =>
  count === 1 ? "prompt" : "prompts";

export const pluralizeIdea = (count: number): string =>
  count === 1 ? "idea" : "ideas";
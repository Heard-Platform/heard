export const pluralizePerson = (count: number): string =>
  count === 1 ? "person" : "people";

export const pluralizeStatement = (count: number): string =>
  count === 1 ? "statement" : "statements";

export const pluralizeQuestion = (count: number): string =>
  count === 1 ? "question" : "questions";

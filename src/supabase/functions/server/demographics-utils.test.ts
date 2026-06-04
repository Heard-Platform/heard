import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { it } from "@std/testing/bdd";
import { calcDemographicBreakdown } from "./demographics-utils.ts";

it("calcs demographics for single question type", () => {
  const questions = [{ id: "q1", type: "gender" }] as any;
  const answers = [
    { questionId: "q1", answer: "Male", },
    { questionId: "q1", answer: "Female", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(breakdown, { gender: { Male: 1, Female: 1 } });
});

it("calcs demographics for multiple question types", () => {
  const questions = [
    { id: "q1", type: "gender" },
    { id: "q2", type: "age" },
  ] as any;
  const answers = [
    { questionId: "q1", answer: "Male", },
    { questionId: "q1", answer: "Female", },
    { questionId: "q1", answer: "Female", },
    { questionId: "q2", answer: "18-24", },
    { questionId: "q2", answer: "25-34", },
    { questionId: "q2", answer: "35-44", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(
    breakdown,
    {
      gender: { Male: 1, Female: 2 },
      age: { "18-24": 1, "25-34": 1, "35-44": 1 },
    }
  );
});

it("handles empty answers", () => {
  const questions = [{ id: "q1", type: "gender" }] as any;
  const answers = [] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(breakdown, { });
});

it("handles skip answers", () => {
  const questions = [{ id: "q1", type: "gender" }] as any;
  const answers = [
    { questionId: "q1", answer: null, },
    { questionId: "q1", answer: "Female", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(breakdown, { gender: { Female: 1, "Not answered": 1 } });
});

it("handles custom questions", () => {
  const questions = [
    { id: "q1", type: "gender" },
    { id: "q2", type: "custom", text: "Favorite color?" },
  ] as any;
  const answers = [
    { questionId: "q1", answer: "Male", },
    { questionId: "q1", answer: "Male", },
    { questionId: "q2", answer: "Blue", },
    { questionId: "q2", answer: "Red", },
    { questionId: "q2", answer: "Blue", },
  ] as any;

  const breakdown = calcDemographicBreakdown(questions, answers);

  assertEquals(
    breakdown,
    {
      "gender": { Male: 2, },
      "Favorite color?": { Blue: 2, Red: 1 },
    }
  );
});
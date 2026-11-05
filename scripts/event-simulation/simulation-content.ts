import type { EventOnboardingQuestionInput } from "../../src/types/index.ts";
import type { EventPostDraft } from "../shared/event-post-creation.ts";

export const SIMULATION_POSTS: EventPostDraft[] = [
  {
    topic: "What would make your neighborhood a better place to live in the next five years?",
    statements: [
      "We need more protected bike lanes.",
      "Rents are the biggest problem by far.",
      "Our parks need more upkeep, not more parks.",
      "Buses should come every ten minutes or better.",
      "Small businesses need help competing with chains.",
      "Streets should be safer for kids walking to school.",
    ],
  },
  {
    topic: "How should your workplace handle remote and in-office work?",
    statements: [
      "Two office days a week is the right balance.",
      "Fully remote teams can work just as well.",
      "New hires learn faster in the office.",
      "Meetings should default to video so everyone can join.",
      "Commute time should count as work time.",
    ],
  },
  {
    topic: "What should a city spend a surprise budget surplus on?",
    statements: [
      "Fix the roads and sidewalks first.",
      "Put it in a rainy day fund.",
      "Expand after-school programs.",
      "Give it back to residents as a tax credit.",
      "Build more affordable housing.",
      "Hire more teachers.",
    ],
  },
];

export const SIMULATED_ATTENDEE_STATEMENTS = [
  "Nobody asks the people who are most affected.",
  "This should be decided by a public vote.",
  "We keep talking about this and nothing changes.",
  "The cost matters more than people admit.",
  "Start small, measure it, then expand.",
  "Most people would agree if it were explained better.",
  "The real problem is trust, not money.",
  "Whatever we do, it should be fair to newcomers.",
  "Older residents see this very differently.",
  "We should copy what has worked in other cities.",
  "Short-term fixes keep making it worse.",
  "Ask the people doing the work every day.",
  "This affects renters more than owners.",
  "Transparency would solve half of this.",
  "I changed my mind on this in the last year.",
  "The loudest voices aren't the majority here.",
];

export const SIMULATION_ONBOARDING_QUESTIONS = [
  {
    text: "Are you a...",
    options: [
      "Student",
      "Faculty",
      "Staff",
      "Community member",
      "Other",
    ],
    multiSelect: false,
  },
  {
    text: "How old are you?",
    options: ["Under 25", "25 to 39", "40 to 59", "60 or older"],
    multiSelect: false,
  },
  {
    text: "How long have you lived in the area?",
    options: ["Under a year", "1 to 5 years", "More than 5 years"],
    multiSelect: false,
  },
  {
    text: "Political orientation",
    options: [
      "Conservative",
      "Moderate",
      "Liberal",
      "Progressive",
      "Independent",
      "Other",
    ],
    multiSelect: false,
  },
  {
    text: "How do you identify? Check all that apply.",
    options: [
      "Black",
      "White",
      "Latino",
      "Asian",
      "Middle Eastern",
      "Indigenous",
      "Immigrant",
      "Other",
    ],
    multiSelect: true,
  },
] satisfies EventOnboardingQuestionInput[];

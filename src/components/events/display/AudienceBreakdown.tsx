import { motion } from "motion/react";
import { X } from "lucide-react";
import type {
  AudienceBreakdownOption,
  AudienceBreakdownQuestion,
} from "../../../types";
import { Button } from "../../ui/button";

const MOST_COLUMNS = 3;
const FEWEST_PEOPLE_PER_ANSWER = 5;
const FEWEST_PEOPLE_PER_QUESTION = 10;

const GRID_COLUMNS_CLASS_NAME_BY_COUNT: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
};

const countColumns = (questionCount: number): number => {
  if (questionCount === 4) return 2;
  return Math.min(questionCount, MOST_COLUMNS);
};

interface AudienceBreakdownProps {
  questions: AudienceBreakdownQuestion[];
  onClose: () => void;
}

export function AudienceBreakdown({
  questions,
  onClose,
}: AudienceBreakdownProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="display-screen-bg absolute inset-0 flex flex-col gap-[1.4cqw] px-[3.6cqw] py-[2.4cqw]"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-[2.6cqw] font-extrabold tracking-tight">
          Who's in the room
        </h1>
        <Button
          variant="outline"
          size="icon"
          aria-label="Close who's in the room"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      {questions.length === 0 ? (
        <p className="text-[1.4cqw] font-semibold secondary-text">
          This event has no questions about who's here.
        </p>
      ) : (
        <>
          <AudienceQuestionGrid questions={questions} />
          <AnonymityNote />
        </>
      )}
    </motion.div>
  );
}

function AudienceQuestionGrid({
  questions,
}: {
  questions: AudienceBreakdownQuestion[];
}) {
  const columnsClassName =
    GRID_COLUMNS_CLASS_NAME_BY_COUNT[countColumns(questions.length)];
  return (
    <div
      className={`grid min-h-0 flex-1 content-start items-start gap-[1.2cqw] ${columnsClassName}`}
    >
      {questions.map((question) => (
        <AudienceQuestionCard
          key={question.questionId}
          question={question}
        />
      ))}
    </div>
  );
}

function AnonymityNote() {
  return (
    <p className="text-center text-[1cqw] font-semibold secondary-text">
      To protect anonymity, answers picked by fewer than{" "}
      {FEWEST_PEOPLE_PER_ANSWER} people are grouped into Other or
      hidden, and a question's results appear once{" "}
      {FEWEST_PEOPLE_PER_QUESTION} people have answered it.
    </p>
  );
}

function AudienceQuestionCard({
  question,
}: {
  question: AudienceBreakdownQuestion;
}) {
  return (
    <section className="normal-bg flex flex-col gap-[0.8cqw] rounded-[1cqw] p-[1.2cqw] shadow-sm">
      <div>
        <h2 className="text-[1.35cqw] font-bold leading-tight dark-text">
          {question.text}
        </h2>
        {question.multiSelect && (
          <p className="text-[0.95cqw] font-semibold secondary-text">
            Multi-choice, so results add up past 100%
          </p>
        )}
      </div>
      <AudienceQuestionAnswers question={question} />
    </section>
  );
}

function AudienceQuestionAnswers({
  question,
}: {
  question: AudienceBreakdownQuestion;
}) {
  if (!question.hasEnoughAnswers) {
    return (
      <p className="py-[1cqw] text-[1.15cqw] font-semibold secondary-text">
        Not enough people yet
      </p>
    );
  }
  return (
    <>
      <ul className="flex flex-col gap-[0.35cqw]">
        {question.options.map((option) => (
          <AudienceShareRow key={option.label} option={option} />
        ))}
      </ul>
      {question.hasHiddenAnswers && (
        <p className="text-[0.95cqw] font-semibold secondary-text">
          Some answers hidden to protect anonymity
        </p>
      )}
    </>
  );
}

function AudienceShareRow({
  option,
}: {
  option: AudienceBreakdownOption;
}) {
  const shareClassName = option.isOptOut
    ? "audience-opt-out-share-bg"
    : "audience-share-bg";
  const showsEdge = !option.isOptOut && option.percent > 0;
  return (
    <li className="audience-share-track-bg relative flex h-[2.1cqw] items-center justify-between gap-[1cqw] overflow-hidden rounded-[0.5cqw] px-[0.8cqw]">
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 transition-[width] duration-700 ease-out ${shareClassName}`}
        style={{ width: `${option.percent}%` }}
      >
        {showsEdge && (
          <span className="audience-share-edge-bg absolute inset-y-0 left-0 w-[0.3cqw]" />
        )}
      </span>
      <span
        className={`relative min-w-0 truncate text-[1.1cqw] font-semibold ${option.isOptOut ? "secondary-text" : "dark-text"}`}
      >
        {option.label}
      </span>
      <span className="relative text-[1.1cqw] font-extrabold tabular-nums dark-text">
        {option.percent}%
      </span>
    </li>
  );
}

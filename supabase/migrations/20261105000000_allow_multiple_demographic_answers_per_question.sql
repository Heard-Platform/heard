alter table demographic_answers
  drop constraint if exists "demographic_answers_userId_questionId_key";

alter table demographic_answers
  add constraint demographic_answers_one_row_per_user_question_and_answer
  unique nulls not distinct ("userId", "questionId", answer);

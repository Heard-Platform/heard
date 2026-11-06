import { ANONYMOUS_ACTION_NOT_ALLOWED_ERROR } from "./constants/errors";

export const ACCOUNT_REQUIRED_FLYER_VOTE_MESSAGE =
  "⚠️ This conversation requires an account.";
export const GENERIC_FLYER_VOTE_FAILURE_MESSAGE =
  "Failed to process flyer vote";

export const flyerVoteFailureMessage = (errorCode?: string) => {
  if (errorCode === ANONYMOUS_ACTION_NOT_ALLOWED_ERROR) {
    return ACCOUNT_REQUIRED_FLYER_VOTE_MESSAGE;
  }
  return GENERIC_FLYER_VOTE_FAILURE_MESSAGE;
};

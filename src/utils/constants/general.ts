import { Environment } from "../../types";

export const getEnvironment = (): Environment => {
  return (import.meta.env.VITE_HEARD_ENV as Environment) || "development";
};

export const FEED_CARD_WIDTH = "w-full max-w-2xl";

export const FEED_CARD_INACTIVE_SCALE = 0.95;
export const FEED_CARD_INACTIVE_OPACITY = 0.35;
export const FEED_CARD_TRANSITION_DURATION = 0.2;
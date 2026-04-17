import { Environment } from "../../types";

export const getEnvironment = (): Environment => {
  return (import.meta.env.VITE_HEARD_ENV as Environment) || "development";
};

export const FEED_CARD_WIDTH = "w-full max-w-2xl";
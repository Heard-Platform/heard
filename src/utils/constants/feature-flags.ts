
import { Environment } from "../../types";
import { getEnvironment } from "./general";

export enum FeatureFlags {
  ONLY_JOINED_COMMUNITIES = "ONLY_JOINED_COMMUNITIES",
  DEMOGRAPHICS = "DEMOGRAPHICS",
  EVENTS = "EVENTS",
  FLYER_SWIPE = "FLYER_SWIPE",
  CIVIC_FLYER_RESULTS = "CIVIC_FLYER_RESULTS",
  STREAMLINED_CREATION = "STREAMLINED_CREATION",
  FEEDBACK_CARDS = "FEEDBACK_CARDS",
  LIVE_EVENTS = "LIVE_EVENTS",
  CHANCE_CARD = "CHANCE_CARD",
  VOTE_RESULT_SNACKBAR = "VOTE_RESULT_SNACKBAR",
}

export interface FeatureFlagsConfig {
  [FeatureFlags.ONLY_JOINED_COMMUNITIES]: boolean;
  [FeatureFlags.DEMOGRAPHICS]: boolean;
  [FeatureFlags.EVENTS]: boolean;
  [FeatureFlags.FLYER_SWIPE]: boolean;
  [FeatureFlags.CIVIC_FLYER_RESULTS]: boolean;
  [FeatureFlags.STREAMLINED_CREATION]: boolean;
  [FeatureFlags.FEEDBACK_CARDS]: boolean;
  [FeatureFlags.LIVE_EVENTS]: boolean;
  [FeatureFlags.CHANCE_CARD]: boolean;
  [FeatureFlags.VOTE_RESULT_SNACKBAR]: boolean;
}

export const FEATURE_FLAGS: Record<Environment, FeatureFlagsConfig> = {
  production: {
    ONLY_JOINED_COMMUNITIES: true,
    DEMOGRAPHICS: true,
    EVENTS: false,
    FLYER_SWIPE: true,
    CIVIC_FLYER_RESULTS: true,
    STREAMLINED_CREATION: true,
    FEEDBACK_CARDS: true,
    LIVE_EVENTS: true,
    CHANCE_CARD: false,
    VOTE_RESULT_SNACKBAR: true,
  },
  development: {
    ONLY_JOINED_COMMUNITIES: true,
    DEMOGRAPHICS: true,
    EVENTS: false,
    FLYER_SWIPE: true,
    CIVIC_FLYER_RESULTS: true,
    STREAMLINED_CREATION: true,
    FEEDBACK_CARDS: true,
    LIVE_EVENTS: true,
    CHANCE_CARD: false,
    VOTE_RESULT_SNACKBAR: true,
  }
}

export const isFeatureEnabled = (flag: FeatureFlags): boolean => {
  const env = getEnvironment();
  return FEATURE_FLAGS[env][flag];
}
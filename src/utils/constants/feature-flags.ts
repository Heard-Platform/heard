
import { Environment } from "../../types";
import { getEnvironment } from "./general";

export enum FeatureFlags {
  ONLY_JOINED_COMMUNITIES = "ONLY_JOINED_COMMUNITIES",
  DEMOGRAPHICS = "DEMOGRAPHICS",
  EVENTS = "EVENTS",
  FLYER_SWIPE = "FLYER_SWIPE",
  CIVIC_FLYER_RESULTS = "FLYER_RESULTS",
}

export interface FeatureFlagsConfig {
  [FeatureFlags.ONLY_JOINED_COMMUNITIES]: boolean;
  [FeatureFlags.DEMOGRAPHICS]: boolean;
  [FeatureFlags.EVENTS]: boolean;
  [FeatureFlags.FLYER_SWIPE]: boolean;
  [FeatureFlags.CIVIC_FLYER_RESULTS]: boolean;
}

export const FEATURE_FLAGS: Record<Environment, FeatureFlagsConfig> = {
  production: {
    ONLY_JOINED_COMMUNITIES: true,
    DEMOGRAPHICS: true,
    EVENTS: false,
    FLYER_SWIPE: true,
    FLYER_RESULTS: false,
  },
  development: {
    ONLY_JOINED_COMMUNITIES: true,
    DEMOGRAPHICS: true,
    EVENTS: false,
    FLYER_SWIPE: true,
    FLYER_RESULTS: true,
  }
}

export const isFeatureEnabled = (flag: FeatureFlags): boolean => {
  const env = getEnvironment();
  return FEATURE_FLAGS[env][flag];
}
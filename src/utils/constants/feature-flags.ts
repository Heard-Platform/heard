import { Environment } from "../../types";
import { getEnvironment } from "./general";

export enum FeatureFlags {
  ONLY_JOINED_COMMUNITIES = "ONLY_JOINED_COMMUNITIES",
  DEMOGRAPHICS = "DEMOGRAPHICS",
}

export interface FeatureFlagsConfig {
  [FeatureFlags.ONLY_JOINED_COMMUNITIES]: boolean;
  [FeatureFlags.DEMOGRAPHICS]: boolean;
}

export const FEATURE_FLAGS: Record<Environment, FeatureFlagsConfig> = {
  production: {
    ONLY_JOINED_COMMUNITIES: true,
    DEMOGRAPHICS: true,
  },
  development: {
    ONLY_JOINED_COMMUNITIES: true,
    DEMOGRAPHICS: true,
  }
}

export const isFeatureEnabled = (flag: FeatureFlags): boolean => {
  const env = getEnvironment();
  return FEATURE_FLAGS[env][flag];
}
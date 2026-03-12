import { getInternalVar, setInternalVar } from "./model-utils.ts";
import { InternalVarKey } from "./types.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { Hono } from "npm:hono";

const app = new Hono();

interface EnrichmentConfig {
  enabled: boolean;
  averageIntervalMins: number;
}

const DEFAULT_ENRICHMENT_CONFIG: EnrichmentConfig = {
  enabled: false,
  averageIntervalMins: 5,
};

export async function getEnrichmentConfig(): Promise<EnrichmentConfig> {
  const enabled = await getInternalVar<boolean>(InternalVarKey.ENRICHMENT_ON);
  const avgInterval = await getInternalVar<number>(InternalVarKey.ENRICHMENT_AVG_INTERVAL_MINS);

  if (enabled === null || avgInterval === null) {
    return DEFAULT_ENRICHMENT_CONFIG;
  }

  return {
    enabled,
    averageIntervalMins: avgInterval,
  };
}

export async function setEnrichmentConfig(config: EnrichmentConfig): Promise<void> {
  await setInternalVar(InternalVarKey.ENRICHMENT_ON, config.enabled);
  await setInternalVar(InternalVarKey.ENRICHMENT_AVG_INTERVAL_MINS, config.averageIntervalMins);
}

app.get(
  "/make-server-f1a393b4/internal/config/enrichment",
  defineRoute(
    {},
    async () => {
      const config = await getEnrichmentConfig();
      return config;
    },
    "Failed to get enrichment config"
  ),
);

app.post(
  "/make-server-f1a393b4/internal/config/enrichment",
  defineRoute(
    {
      enabled: {
        type: 'boolean',
        required: true,
      },
      averageIntervalMins: {
        type: 'number',
        required: true,
        validate: (value: number) => value > 0,
        errorMessage: 'averageIntervalMins must be a positive number',
      },
    },
    async (params: { enabled: boolean; averageIntervalMins: number }) => {
      const config: EnrichmentConfig = {
        enabled: params.enabled,
        averageIntervalMins: params.averageIntervalMins,
      };

      await setEnrichmentConfig(config);

      return config;
    },
    "Failed to set enrichment config"
  ),
);

export { app as internalConfigApi };
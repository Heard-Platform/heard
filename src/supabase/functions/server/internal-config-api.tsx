import { getInternalVar, setInternalVar } from "./model-utils.ts";
import { InternalVarKey } from "./types.tsx";
import { defineRoute } from "./route-wrapper.tsx";
import { Hono } from "npm:hono";
import { validateDeveloper } from "./internal-utils.ts";

const app = new Hono();

interface AutopopulatorConfig {
  enabled: boolean;
  averageIntervalMins: number;
}

const DEFAULT_AUTOPOPULATOR_CONFIG: AutopopulatorConfig = {
  enabled: false,
  averageIntervalMins: 5,
};

export async function getAutopopulatorConfig(): Promise<AutopopulatorConfig> {
  const enabled = await getInternalVar<boolean>(InternalVarKey.AUTO_POPULATOR_ON);
  const avgInterval = await getInternalVar<number>(InternalVarKey.AUTO_POPULATE_AVG_INTERVAL_MINS);

  if (enabled === null || avgInterval === null) {
    return DEFAULT_AUTOPOPULATOR_CONFIG;
  }

  return {
    enabled,
    averageIntervalMins: avgInterval,
  };
}

export async function setAutopopulatorConfig(config: AutopopulatorConfig): Promise<void> {
  await setInternalVar(InternalVarKey.AUTO_POPULATOR_ON, config.enabled);
  await setInternalVar(InternalVarKey.AUTO_POPULATE_AVG_INTERVAL_MINS, config.averageIntervalMins);
}

app.get(
  "/make-server-f1a393b4/internal/config/autopopulator",
  validateDeveloper,
  defineRoute(
    {},
    async () => {
      const config = await getAutopopulatorConfig();
      return config;
    },
    "Failed to get autopopulator config"
  ),
);

app.post(
  "/make-server-f1a393b4/internal/config/autopopulator",
  validateDeveloper,
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
      const config: AutopopulatorConfig = {
        enabled: params.enabled,
        averageIntervalMins: params.averageIntervalMins,
      };

      await setAutopopulatorConfig(config);

      return config;
    },
    "Failed to set autopopulator config"
  ),
);

export { app as internalConfigApi };
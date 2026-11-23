import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  getResendApiKeyOnlyInProd,
  isRunningInProd,
} from "./environment-utils.ts";

const withEnvironment = (
  variables: Record<string, string | undefined>,
  runCheck: () => void,
) => {
  const variableNames = Object.keys(variables);
  const originalValues = variableNames.map((name) => Deno.env.get(name));
  variableNames.forEach((name) => {
    const value = variables[name];
    if (value === undefined) {
      Deno.env.delete(name);
    } else {
      Deno.env.set(name, value);
    }
  });
  try {
    runCheck();
  } finally {
    variableNames.forEach((name, index) => {
      const originalValue = originalValues[index];
      if (originalValue === undefined) {
        Deno.env.delete(name);
      } else {
        Deno.env.set(name, originalValue);
      }
    });
  }
};

Deno.test("returns the Resend key in production", () => {
  withEnvironment(
    { HEARD_ENV: "production", RESEND_API_KEY: "resend-test-key" },
    () => {
      assertEquals(isRunningInProd(), true);
      assertEquals(getResendApiKeyOnlyInProd(), "resend-test-key");
    },
  );
});

Deno.test("withholds the Resend key in development", () => {
  withEnvironment(
    { HEARD_ENV: "development", RESEND_API_KEY: "resend-test-key" },
    () => {
      assertEquals(isRunningInProd(), false);
      assertEquals(getResendApiKeyOnlyInProd(), undefined);
    },
  );
});

Deno.test("withholds the Resend key when no environment is set", () => {
  withEnvironment(
    { HEARD_ENV: undefined, RESEND_API_KEY: "resend-test-key" },
    () => {
      assertEquals(isRunningInProd(), false);
      assertEquals(getResendApiKeyOnlyInProd(), undefined);
    },
  );
});

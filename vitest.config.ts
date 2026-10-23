import { defineConfig } from "vitest/config";

// Exclude Deno-only backend and script tests. Those use https:// imports and `Deno.test`
// which Vitest can't run. Backend tests live under src/supabase and are run
// via `npm run test:server` (deno test); script tests via `npm run test:scripts`.
export default defineConfig({
  test: {
    exclude: ["src/supabase/**", "scripts/**", "node_modules/**", "dist/**"],
  },
});

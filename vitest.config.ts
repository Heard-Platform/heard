import { defineConfig } from "vitest/config";

// Exclude Deno-only backend tests. Those use https:// imports and `Deno.test`
// which Vitest can't run. Backend tests live under src/supabase and are run
// via `npm run test:server` (deno test).
export default defineConfig({
  test: {
    exclude: ["src/supabase/**", "node_modules/**", "dist/**"],
  },
});

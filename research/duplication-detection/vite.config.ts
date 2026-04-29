// @ts-nocheck (mini-app config; type-checked by this dir's own tsconfig, not the project root's)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
  },
});

import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./semantic_classes.css";
import "./styles/z-index.css";

const environment = import.meta.env.VITE_HEARD_ENV ?? import.meta.env.MODE;

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment,
  enabled: import.meta.env.PROD,
});

const posthogEnabled =
  import.meta.env.VITE_POSTHOG_KEY &&
  (import.meta.env.PROD || import.meta.env.VITE_POSTHOG_ENABLE_DEV === "true");

if (posthogEnabled) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST ?? "https://us.i.posthog.com",
    person_profiles: "identified_only",
    session_recording: {
      maskAllInputs: true,
    },
    loaded: (ph) => {
      ph.register({ environment });
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);

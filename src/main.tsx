import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App.tsx";
import { AppBypassPage } from "./AppBypassPage.tsx";
import "./index.css";
import "./semantic_classes.css";
import "./styles/z-index.css";
import { registerServiceWorker } from "./utils/pushNotifications";

if (window.location.pathname === "/app-bypass") {
  createRoot(document.getElementById("root")!).render(<AppBypassPage />);
} else {
  const environment = import.meta.env.VITE_HEARD_ENV ?? import.meta.env.MODE;

  const genericFetchErrorPattern = /Load failed|Failed to fetch|NetworkError when attempting to fetch resource/;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment,
    enabled: import.meta.env.PROD,
    tracesSampleRate: 1.0,
    integrations: [Sentry.captureConsoleIntegration({ levels: ["error"] })],
    beforeSend(event) {
      const message = event.exception?.values?.[0]?.value;
      if (message && genericFetchErrorPattern.test(message)) {
        event.fingerprint = ["generic-fetch-network-error"];
      }
      return event;
    },
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

  registerServiceWorker();
}

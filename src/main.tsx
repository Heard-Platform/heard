import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App.tsx";
import "./index.css";
import "./semantic_classes.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_HEARD_ENV ?? import.meta.env.MODE,
  enabled: import.meta.env.PROD,
});

createRoot(document.getElementById("root")!).render(<App />);

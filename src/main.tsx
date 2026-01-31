import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Ensure users don't get stuck on a stale cached PWA build after updates.
// This project uses vite-plugin-pwa; the virtual module is available at build time.
// In dev we also aggressively unregister to avoid caching-related confusion.
import { registerSW } from "virtual:pwa-register";

if (import.meta.env.DEV && "serviceWorker" in navigator) {
  // Avoid service worker caching in preview/dev
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

// In production, auto-update and hard refresh when a new version is available.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Force the new service worker to activate and reload the app.
    updateSW(true);
  },
});

createRoot(document.getElementById("root")!).render(<App />);

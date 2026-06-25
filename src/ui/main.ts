import "./styles.css";
import { init } from "./app";

init();

// Register the offline service worker (production builds only).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

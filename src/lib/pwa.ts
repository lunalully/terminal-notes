/**
 * Guarded service-worker registration (vite-plugin-pwa / generateSW output).
 * Never registers in dev, iframes, or preview hosts.
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const { hostname } = window.location;
  const blocked =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    hostname.startsWith("preview--") ||
    new URL(window.location.href).searchParams.get("sw") === "off";

  if (blocked) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        if (reg.active?.scriptURL.endsWith("/sw.js")) void reg.unregister();
      }
    });
    return;
  }

  void navigator.serviceWorker.register("/sw.js");
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function sendTestPushNotification(): Promise<void> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    throw new Error("Push notifications are not supported in this browser");
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const registration = await navigator.serviceWorker.ready;
  const delayMs = 3000;
  alert(`Notification will fire in ${delayMs / 1000}s — background the app now to see it as a banner.`);
  registration.active?.postMessage({ type: "SCHEDULE_TEST_NOTIFICATION", delayMs });
}

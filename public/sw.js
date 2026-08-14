self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Heard";
  const options = {
    body: data.body || "",
    icon: data.icon || "/monkey.png",
    badge: data.badge || "/monkey.png",
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "SCHEDULE_TEST_NOTIFICATION") return;
  const delay = event.data.delayMs ?? 3000;
  event.waitUntil(
    new Promise((resolve) => setTimeout(resolve, delay)).then(() =>
      self.registration.showNotification("Heard", {
        body: "This is a test push notification 🎉",
        icon: "/monkey.png",
        badge: "/monkey.png",
        data: { url: "/" },
      }),
    ),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if ("clearAppBadge" in navigator) {
    navigator.clearAppBadge();
  }
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => client.url === url);
        if (existing) return existing.focus();
        return self.clients.openWindow(url);
      }),
  );
});

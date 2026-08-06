/* NestFlow Web Push service worker */
self.addEventListener("push", (event) => {
  let data = { title: "NestFlow", body: "", href: "/app/notifications" };
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "NestFlow", {
      body: data.body || "",
      data: { href: data.href || "/app/notifications" },
      icon: "/favicon.ico",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href || "/app/notifications";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(href);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(href);
      }
      return undefined;
    }),
  );
});

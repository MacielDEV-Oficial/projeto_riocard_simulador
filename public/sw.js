self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    requestUrl.origin === self.location.origin &&
    requestUrl.pathname.startsWith("/api/")
  )
    return;
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const cloned = response.clone();
        caches
          .open("riocard-cache")
          .then((cache) => cache.put(event.request, cloned));
        return response;
      });
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        if (clients.length > 0) {
          const client = clients[0];
          return client.focus();
        }

        return self.clients.openWindow("/");
      }),
  );
});

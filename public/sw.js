const VERSION = "peaceworks-pwa-v1";

self.addEventListener("install", () => {
  // Do not skip waiting: an update must not force-refresh active user work.
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("peaceworks-pwa-") && key !== VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
});

// Intentionally no fetch handler. All pages, API requests, authentication,
// assessments, payments, and personalized data remain network-controlled.

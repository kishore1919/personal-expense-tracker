// Minimal service worker to prevent 404s from stale registrations
// This service worker does nothing significant: it immediately takes control
// and then simply passes through fetch events. You can extend it later with
// caching strategies if you decide to use service workers formally.

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Become the controlling worker
  event.waitUntil(self.clients.claim());
});

// Optional: a simple fetch handler that does nothing special
self.addEventListener('fetch', (event) => {
  // Let the request bypass the service worker by default
});

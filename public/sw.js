// Dynamic cache name based on build timestamp
const CACHE_VERSION = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
const CACHE_NAME = `tttracker-${CACHE_VERSION}`;

// Core files that should always be cached
const CORE_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Network-first strategy for HTML and API calls
const NETWORK_FIRST_PATTERNS = [
  /\.html$/,
  /\/api\//,
  /\/$/  // Root path
];

// Cache-first strategy for static assets
const CACHE_FIRST_PATTERNS = [
  /\.(?:css|js|woff|woff2|ttf|eot|ico|png|svg|jpg|jpeg|gif)$/
];

// Install event - cache core resources and take control immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching core resources');
        return cache.addAll(CORE_CACHE_URLS);
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
  // Skip waiting and take control immediately
  self.skipWaiting();
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-http requests
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    (async () => {
      // Network-first strategy for HTML and API calls
      if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(requestUrl.pathname))) {
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('[SW] Network failed, trying cache:', requestUrl.pathname);
        }
        
        // Fallback to cache if network fails
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Final fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        // Return network error for other requests
        return new Response('Network Error', { status: 408 });
      }
      
      // Cache-first strategy for static assets
      if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(requestUrl.pathname))) {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          // Check if cached response is older than 1 hour
          const cacheDate = cachedResponse.headers.get('date');
          if (cacheDate && (Date.now() - new Date(cacheDate).getTime()) > 3600000) {
            // Try to fetch fresh version in background
            try {
              const networkResponse = await fetch(event.request);
              if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              }
            } catch (error) {
              console.log('[SW] Background refresh failed, using cache:', requestUrl.pathname);
            }
          }
          return cachedResponse;
        }
        
        // Fetch and cache new static assets
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          }
        } catch (error) {
          console.log('[SW] Failed to fetch asset:', requestUrl.pathname);
        }
      }
      
      // Default: try network first, fallback to cache
      try {
        return await fetch(event.request);
      } catch (error) {
        const cachedResponse = await caches.match(event.request);
        return cachedResponse || new Response('Offline', { status: 503 });
      }
    })()
  );
});

// Activate event - cleanup old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('tttracker-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Claim all clients immediately
      return self.clients.claim();
    })()
  );
});

// Handle background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // Sync any offline data when connection is restored
      Promise.resolve()
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
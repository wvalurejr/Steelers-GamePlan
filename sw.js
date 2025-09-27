// Basic Service Worker for Steelers GamePlan
// This eliminates the 404 error and provides basic offline functionality

const CACHE_NAME = 'steelers-gameplan-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/admin.html',
    '/styles/main.css',
    '/styles/admin.css',
    '/js/app.js',
    '/js/admin.js',
    '/js/canvas.js',
    '/js/library.js',
    '/js/lineups.js',
    '/js/firebase-service.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.warn('Service Worker: Cache install failed:', error);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // Fallback for navigation requests when offline
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `ghost-${version}`;

// Install: cache the app shell
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(build))
			.then(() => sw.skipWaiting())
	);
});

// Activate: clean up old caches
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
			);
		}).then(() => sw.clients.claim())
	);
});

// Fetch: network-first strategy (since offline not needed)
sw.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Skip API requests and form submissions
	const url = new URL(event.request.url);
	if (url.pathname.startsWith('/api')) return;

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Clone and cache successful responses
				if (response.ok) {
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
				}
				return response;
			})
			.catch(() => {
				// Fall back to cache if network fails
				return caches.match(event.request).then((cached) => {
					return cached || new Response('Offline', { status: 503 });
				});
			})
	);
});

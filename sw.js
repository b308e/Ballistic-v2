/* ============================================================================
   sw.js — Service Worker der Sniper-Ballistik-PWA
   ----------------------------------------------------------------------------
   Cache-Version: sniper-v17  (Stand: 2026-11-27, App v1.1.0)
   Strategie:
     - Navigation (HTML):  Network-first, Offline-Fallback auf gecachtes index.html
     - sw.js selbst:       Network-first, damit die Versions-Karte frisch liest
     - App-Assets:         Cache-first (Version-Bump bei JEDEM Release Pflicht!)
     - Wetter-APIs:        werden NIE gecacht (immer live, Offline = Fehlermeldung)
   Install ist fehlertolerant: einzelne fehlende Assets (z. B. Icons) verhindern
   nicht die Offline-Fähigkeit der Kern-App.
   WORKFLOW BEI UPDATES: CACHE_VERSION hochzählen -> pushen -> Seite neu laden.
   ========================================================================== */
'use strict';

var CACHE_VERSION = 'sniper-v0.13';
var CACHE_NAME = 'sniper-' + CACHE_VERSION;

/* Alle App-Assets relativ zum SW-Scope (funktioniert auf GitHub Pages
   unter /Ballistic-v2/ ebenso wie auf localhost oder eigener Domain). */
var PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './ballistics.js',
  './ammo-db-long.js',
  './ammo-db-short.js',
  './app.js',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png'
];

/* Hosts, deren Antworten niemals in den Cache wandern dürfen. */
var NEVER_CACHE_HOSTS = /open-meteo\.com|openweathermap\.org|weatherapi\.com|meteoblue\.com/i;

/* ----------------------------------------------------------------------------
   INSTALL: Precache (fehlertolerant pro Datei), sofort aktiv werden
   -------------------------------------------------------------------------- */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return Promise.all(PRECACHE_ASSETS.map(function (url) {
        return cache.add(url).catch(function (err) {
          console.warn('[SW] Precache übersprungen:', url, err);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* ----------------------------------------------------------------------------
   ACTIVATE: alte Cache-Versionen löschen, offene Tabs übernehmen
   -------------------------------------------------------------------------- */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key !== CACHE_NAME && key.indexOf('sniper-') === 0) {
          return caches.delete(key);
        }
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ----------------------------------------------------------------------------
   MESSAGE: explizites Skip-Waiting von der Seite aus (optional nutzbar)
   -------------------------------------------------------------------------- */
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ----------------------------------------------------------------------------
   FETCH-STRATEGIEN
   -------------------------------------------------------------------------- */
function networkFirst(request, fallbackUrls) {
  return fetch(request).then(function (response) {
    if (response && response.status === 200 && response.type === 'basic') {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function () {
    return caches.match(request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      var chain = Promise.resolve(null);
      (fallbackUrls || []).forEach(function (url) {
        chain = chain.then(function (found) {
          return found || caches.match(url, { ignoreSearch: true });
        });
      });
      return chain.then(function (found) {
        return found || new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    });
  });
}

function cacheFirst(request) {
  return caches.match(request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(request).then(function (response) {
      if (response && response.status === 200 && response.type === 'basic') {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function () {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try { url = new URL(request.url); } catch (e) { return; }

  /* Wetter & alles Fremde: niemals cachen, direkt ans Netz durchreichen.
     Offline schlägt der Request fehl -> die App zeigt ihre Fehlermeldung. */
  if (url.origin !== self.location.origin || NEVER_CACHE_HOSTS.test(url.hostname)) {
    return;
  }

  /* sw.js selbst: immer frisch vom Netz (Versions-Karte), Offline aus Cache. */
  if (/\/sw\.js$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, ['./sw.js']));
    return;
  }

  /* Navigation: Network-first, Offline-Fallback auf die App-Hülle. */
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, ['./index.html', './']));
    return;
  }

  /* Alles andere (JS/CSS/Manifest/Icons): Cache-first. */
  event.respondWith(cacheFirst(request));
});
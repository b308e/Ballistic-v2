/* ============================================================================
 * sw.js — Service Worker der Ballistik-PWA
 * ----------------------------------------------------------------------------
 * Offline-Fähigkeit nach dem ersten Laden, Android Chrome + iOS Safari,
 * auch als installierte PWA. Kommentare Deutsch, Variablen Englisch.
 *
 * WICHTIG — AUSTAUSCH DER EXTERNEN DB:
 * Werden ammo-db-long.js oder ammo-db-short.js durch die echte DB ersetzt,
 * MUSS CACHE_VERSION erhöht werden (z. B. sniper-v15 -> sniper-v16).
 * Sonst liefert der Cache weiterhin die alte Datenbank aus.
 *
 * WICHTIG — WETTER-API:
 * Open-Meteo (und generell alle Fremdorigins) werden NIEMALS gecacht.
 * Der Worker reicht solche Anfragen unverändert ans Netz durch.
 * ==========================================================================*/
(function () {
  'use strict';

  /* Cache-Version bei jedem Asset-Wechsel erhöhen, besonders beim DB-Tausch. */
  var CACHE_VERSION = 'sniper-v15';

  /* Kern-Assets: müssen beim Install vollständig gecacht werden. */
  var CORE_ASSETS = [
    './index.html',
    './style.css',
    './ballistics.js',
    './ammo-db-long.js',
    './ammo-db-short.js',
    './app.js',
    './manifest.json'
  ];

  /* Icons sind Pflicht-Assets laut Manifest, liegen aber außerhalb der 8 Dateien.
   * Sie werden einzeln gecacht; fehlt eine Datei, darf die Installation NICHT
   * scheitern (sonst wäre die App nicht offline-fähig). */
  var OPTIONAL_ASSETS = [
    './icon-192.png',
    './icon-512.png'
  ];

  /* Installation: Kern-Assets atomar cachen, Icons best effort, dann sofort aktiv. */
  self.addEventListener('install', function (event) {
    event.waitUntil(
      caches.open(CACHE_VERSION).then(function (cache) {
        return cache.addAll(CORE_ASSETS).then(function () {
          return Promise.all(OPTIONAL_ASSETS.map(function (url) {
            return cache.add(url).catch(function () {
              /* Icon fehlt: bewusst ignorieren, Offline-Kern bleibt intakt. */
              return null;
            });
          }));
        });
      }).then(function () {
        return self.skipWaiting();
      })
    );
  });

  /* Aktivierung: alte Cache-Versionen entfernen, offene Clients übernehmen. */
  self.addEventListener('activate', function (event) {
    event.waitUntil(
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE_VERSION) return caches.delete(key);
          return null;
        }));
      }).then(function () {
        return self.clients.claim();
      })
    );
  });

  /* Fetch-Strategie:
   * - Nur GET, nur eigener Origin. Fremdorigins (Wetter!) bleiben unberührt.
   * - Navigationen: Network-first, offline Fallback auf gecachtes index.html.
   * - Assets: Cache-first mit Netz-Fallback; erfolgreiche Antworten werden
   *     gecacht. Die DB bleibt damit stabil, bis CACHE_VERSION erhöht wird. */
  self.addEventListener('fetch', function (event) {
    var request = event.request;
    if (request.method !== 'GET') return;

    var url;
    try {
      url = new URL(request.url);
    } catch (e) {
      return;
    }

    /* Wetter-API explizit niemals cachen oder abfangen. */
    if (url.hostname.indexOf('open-meteo.com') !== -1) return;

    /* Alles von anderen Origins (CDNs, APIs, Wetter) direkt ans Netz. */
    if (url.origin !== self.location.origin) return;

    /* App-Navigationen: frisch laden, wenn möglich; offline aus dem Cache. */
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request).then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE_VERSION).then(function (cache) {
              cache.put('./index.html', copy);
            });
          }
          return response;
        }).catch(function () {
          return caches.match('./index.html').then(function (cached) {
            return cached || caches.match('./');
          });
        })
      );
      return;
    }

    /* Statische Assets: Cache-first, Netz als Fallback, Erfolg nachcachen. */
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response && response.ok && response.type === 'basic') {
            var copy = response.clone();
            caches.open(CACHE_VERSION).then(function (cache) {
              cache.put(request, copy);
            });
          }
          return response;
        });
      })
    );
  });
})();
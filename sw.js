"use strict";

const CACHE_NAME = "onigogo-cache-v6";

const CACHE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",

  "./css/style.css",

  "./js/data.js",
  "./js/game.js",
  "./js/ui.js",
  "./js/screen.js",
  "./js/panel.js",
  "./js/map.js",
  "./js/piece.js",
  "./js/event.js",
  "./js/drag.js",
  "./js/debug.js",
  "./js/replay.js",
  "./js/main.js",

  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CACHE_FILES);
    }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) {
            return key !== CACHE_NAME;
          })
          .map(function (key) {
            return caches.delete(key);
          }),
      );
    }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    }),
  );
});


var CACHE_NAME = 'my-site-cache-v12';
var urlsToCache = [
  '/',
  '/css/style.css',
  '/js/hammer.min.js',
  '/js/app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache prêt');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    // On cherche si la requête correspond à un élement mis en cache
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          // La requête correspond à un fichier en cache, on le retourne.
          return response;
        }
        // Sinon on renvoie la requête qui tentera de le trouver sur le réseau
        return fetch(event.request);
      })
    );
});

self.addEventListener('activate', function(event) {

  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          // On supprime tous les caches sauf ceux inscrits dans le tableau cacheWhitelist
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('push', function(event) {
  var title = "We reached a milestone.";
  var body = "Come quick! The counter is going crazy!";
  var icon = 'images/icons/icon-android-152x152.png';
  event.waitUntil(
    self.registration.showNotification(title, {
      'body': body,
      'icon': icon
    }));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.matchAll({
    type: 'window'
  }).then(function(clientList) {
    for (var i = 0; i < clientList.length; i++) {
      var client = clientList[i];
      if (client.url === '/' && 'focus' in client) {
        return client.focus();
      }
    }
    if (clients.openWindow) {
      return clients.openWindow('/');
    }
  }));
});

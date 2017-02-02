var pnBtn = document.getElementById('pushBtn');
var hamburgerBtn = document.getElementById('hamburger');
var closeBtn = document.getElementById('close');
var mobilePushBtn = document.getElementById('mobilePushBtn');
var loveBtn = document.getElementById('btn');
var countElement = document.getElementById('count');
var content = document.getElementById('content');
var title = document.getElementById('title');
var onlineElement = document.getElementById('offLine');
var hammertime = new Hammer(document.body);

// Par défaut le compteur est à zéro
var count = localStorage.count || 0;
var defer = localStorage.defer || 0;
var reg;
var sub;
var isSubscribed = false;
var xhr = new XMLHttpRequest();
var clicking = false;

function pushUI(){
  if (isSubscribed) {
    mobilePushBtn.classList.remove('inactive');
    pnBtn.classList.remove('inactive');
  } else {
    mobilePushBtn.classList.add('inactive');
    pnBtn.classList.add('inactive');
  }
}

// Cette fonction permet d'appeler les différents points d'accès de notre api
// tout en passant un callback pour modifier les UIs une fois le résultat reçu
function api(action, value, cb){
  var path = '/';
  switch (action) {
    case 'add':
      path += 'add/'+value;
      break;
    default:
      path += 'add/0';
  }
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if(response.status === 'ok'){
        cb(null, response);
      } else {
        cb('Something is broken.', null);
      }
    } else if(xhr.status == 429){
      alert('Hey mate,\n That is a lot of love coming from you.\nKeep a little for you too.\nCome back in an hour, alright?');
      cb('Something is broken.', null);
    }
  };
  xhr.open('GET', path);
  xhr.send();
}

// Cette fonction va automatiquement gérer l'incrément du compteur si nous sommes
// en ligne ou hors ligne
function updateCounter(){
  if(navigator.onLine){
    onlineElement.style.display = "none";
    api('add', defer, function(err, res){
      if(err){return;}
      count = localStorage.count = countElement.innerText = res.counter;
      localStorage.defer = defer = 0;
    });
  } else {
    onlineElement.style.display = "inline";
    localStorage.defer = defer;
    countElement.innerText = parseInt(count) + parseInt(defer);
  }
}


function subscribe() {
  if(!navigator.onLine){
    pnBtn.classList.add('disabled');
    mobilePushBtn.classList.add('disabled');
    return;
  }
  pnBtn.classList.remove('disabled');
  mobilePushBtn.classList.remove('disabled');
  reg.pushManager.subscribe({userVisibleOnly: true}).
  then(function(pushSubscription) {
    sub = pushSubscription;
    var clientId = pushSubscription.endpoint.split('/').pop();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        if(response.status === 'ok'){
          isSubscribed = true;
          pushUI();
        }
      }
    };
    xhr.open('GET', '/client/'+clientId);
    xhr.send();
  });
}

function unsubscribe() {
  if(!navigator.onLine){
    pnBtn.classList.add('disabled');
    mobilePushBtn.classList.add('disabled');
    return;
  }
  pnBtn.classList.remove('disabled');
  mobilePushBtn.classList.remove('disabled');
  sub.unsubscribe().then(function(event) {
    isSubscribed = false;
    pushUI();
  }).catch(function(error) {
  });
}

// On remplace l'appel à l'API au chargement par l'appel à la fonction updateCounter
updateCounter();

mobilePushBtn.addEventListener('click', function() {
  if (isSubscribed) {
    unsubscribe();
  } else {
    subscribe();
  }
}, false);

pnBtn.addEventListener('click', function() {
  if (isSubscribed) {
    unsubscribe();
  } else {
    subscribe();
  }
}, false);

hamburgerBtn.addEventListener('click', function() {
  document.body.classList.add('navigation');
}, false);

closeBtn.addEventListener('click', function() {
  document.body.classList.remove('navigation');
}, false);

loveBtn.addEventListener('click', function() {
  if (clicking) {
    return;
  }
  clicking = true;
  defer++;
  if(defer > 99){
    defer = 99;
    alert('You reached the 99 maximum hearts you can send offline.\nPlease connect to the Internet to update the counter and continue.');
    return;
  }
  updateCounter();
  content.classList.add("love");
  title.innerHTML = "Love, love, love";
  setTimeout(function() {
      content.classList.remove("love");
      title.innerHTML = "Send some love";
      clicking = false;
  }, 1000);
}, false);

hammertime.on('swipeleft', function() {
	document.body.classList.remove('navigation');
});
hammertime.on('swiperight', function() {
  document.body.classList.add('navigation');
});

// On regarde si le service worker est supporté par le navigateur
if ('serviceWorker' in navigator) {
  // On enregistre notre script sw.js
  navigator.serviceWorker.register('sw.js').then(function() {
    return navigator.serviceWorker.ready;
  }).then(function(serviceWorkerRegistration) {
    reg = serviceWorkerRegistration;
    subscribe();
    console.log('Enregistrement du SW avec succès.');
  }).catch(function(error) {
    console.log('Une erreur est survenue.', error);
  });
}

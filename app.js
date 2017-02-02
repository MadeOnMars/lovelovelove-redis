var express = require('express');
var app = express();
var request = require('request');
var gcmAPIendpoint = 'https://fcm.googleapis.com/fcm/send';
var gcmAPIKey = '___YOUR__GCM___API___KEY___';
var redis = require('redis');
var client = redis.createClient(
  {
    host: '__YOUR___REDIS___HOST',
    port: '___REDIS___PORT___',
    password: '___REDIS___PASSWORD___'
  }
);

app.use(express.static(__dirname + '/public'));

app.listen(3000, function () {
  console.log('Love, love, love app listening on port 3000');
});

function sendPns(){
  client.smembers("clients", function(err, clients){
    request(
      { method: 'POST',
        headers: {
          'Authorization': 'key='+gcmAPIKey,
          'Content-Type' : 'application/json'
        },
        json:{
          registration_ids: clients
        },
        url: gcmAPIendpoint
      }, function (err, response, body) {
        if(err){
          console.log(err);
        }
      });
  });
}


app.get('/add/:id', function(req, res){
  var increment = parseInt(req.params.id) || 0;

  if(Number.isNaN(increment) || increment < 0){
    res.status(500).json({status: 'err'});
    return;
  }

  client.get("count", function(err, counter){
    if (err) {
      res.status(500).json({status: 'err'});
      return;
    }
    var counter = parseInt(counter);
    if(increment === 0){
      res.json({status: 'ok', counter});
      return;
    }
    if((counter + increment)  % 100 == 0){
      sendPns();
    }
    client.incrby("count", increment, function(err, counter){
      if (err) {
        res.status(500).json({status: 'err'});
        return;
      }
      res.json({status: 'ok', counter});
    });
  });
});

app.get('/client/:id', function(req, res){
  var clientId = req.params.id || undefined;
  if(!clientId){
    res.status(500).json({status: 'err'});
    return;
  }
  client.sadd("clients", req.params.id);
  res.json({status: 'ok'});
});

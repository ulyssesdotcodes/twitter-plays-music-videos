var express = require('express')
var app = express()
var Twitter = require('twitter');
const http = require('http');
const url = require('url');
var WebSocket = require('ws')
var path    = require("path");
var config = require("config");

var client = new Twitter(config.get('keys'));

var connections = []

var youtubeRe = /youtu\.be\/([^?]*)/
var latest = "";

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname+'/index.html'))
})

const server = http.createServer(app);
var wss = new WebSocket.Server({server});

wss.on('connection', function connection(ws) {
  const location = url.parse(ws.upgradeReq.url, true);
  // You might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.on('close', function() {
    var ind = connections.indexOf(ws);
    if (ind > -1) {
      connections.splice(ind, 1);
    }
  });

  connections.push(ws)
});

client.stream('statuses/filter', {track: 'youtu be music'},  function(stream) {
  stream.on('data', function(tweet) {
    var link = tweet.entities.urls[0].expanded_url;
    matches = youtubeRe.exec(link)
    if(matches && matches.length > 1) {
      latest = youtubeRe.exec(link)[1];
      for (let conn of connections) {
        conn.send(JSON.stringify({
          videoId: latest,
          tweet: tweet.text
        }));
      }
    }
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});


server.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

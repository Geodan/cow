#!/usr/bin/env node
var fs = require('fs');
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    //Automatically redirect to the location of the cow-client
    response.writeHead(301, { 'Location' : 'http://model.geodan.nl/websocket/'});
    response.end();
});
server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    maxReceivedFrameSize: 0x100000,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

var connections = [];

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {
    console.log('start');
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('connect', request.origin);
      connections.push(connection);
      console.log(connections.length);
      var ci = connections.indexOf(connection);
      connection.sendUTF('{"action":"connected","payload":{"cid":'+ci+'}}');
      connection.on('message', function(message) {
      if (message.type === 'utf8') {
        connections.forEach(function(destination) {
          destination.sendUTF(message.utf8Data);
        });
      }
    });

    connection.on('close', function() {
      console.log(connection.remoteAddress + " disconnected");
        var index = connections.indexOf(connection);
        if (index !== -1) {
            // remove the connection from the pool
          connections.splice(index, 1);
          connections.forEach(function(destination) {
            //alert the other peers
            var ci = connections.indexOf(destination);
            destination.sendUTF('{"action":"peerGone","payload":{"peerCid":'+index+',"newCid":'+ci+'}}');
          });
        }
    });
});

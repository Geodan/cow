#!/usr/bin/env node
/* Copyright (c) 2011 by COW Contributors (see AUTHORS for
 * full list of contributors). Published under the MIT license.
 * See https://github.com/Geodan/cow/blob/master/LICENSE for the
 * full text of the license. */
var fs = require('fs');
var WebSocketServer = require('websocket').server;
var http = require('http');
var app_loaded=false;

var server = http.createServer(function(request, response) {
  console.log((new Date()) + ' Received request for ' + request.url);
  if(!app_loaded)
  {
    process.on('uncaughtException', function (err) {
      console.log('Caught exception: ' + err.stack);
    });
    app_loaded=true;
  }
  try
  {    
    //Automatically redirect to the location of the cow-client
    response.writeHead(301, { 'Location' : 'http://model.geodan.nl/websocket/'});
    response.end();
  }
  catch(e)
  {
   console.log(e.stack);
  }
});
server.listen(8081, function() {
    console.log((new Date()) + ' Server is listening on port 8081');
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
var peers = [];
function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

wsServer.on('request', function(request) {    
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  
  /*
   Accepting a new connection and add the connection to the internal
   stack of connections for future reference and tell the new
   connection that it is connected and give its cash-ID (==ci)
  */
  var connection = request.accept('connect', request.origin);
  connections.push(connection);
  var ci = connections.indexOf(connection);
  connection.sendUTF('{"action":"connected","payload":{"cid":'+ci+'}}');
  
  /*
   Once a connection is established messages can be received, these
   need to be passed around to all other members.
   A cow-client belongs to a project, certain messages are only meant
   for project-members and cash should make sure that it knows which
   cow is in which project and pass the messages on to the correct members.
  */
  connection.on('message', function(message) {
    if (message.type === 'utf8'&& message.utf8Data !==undefined) {
      var data = JSON.parse(message.utf8Data);
     
      if(data.target) {
        
        var index = peers.indexOf(data.target);
        if (index !== -1) {
            connections[index].sendUTF(message.utf8Data);
            console.log('tarrget ' + data.target);
        }
    
      }
      else {
        connections.forEach(function(destination) {
          destination.sendUTF(message.utf8Data);
        });
        var action = data.action;
        switch (action) {
            /*These are the actions needed to make sure that the cid and uid are correct*/
            //a peer is gone and everybody has a new connection-id, recieve a connectionID with UID
           /* case 'updatePeers':
                
                var uid = data.payload.uid;
                var cid = data.payload.connectionID;
                peers[cid] = uid;
                console.log('newpeers: ' + peers);
            break;*/
            //a new peer just joined, recieve its status: connection-id, uid, extent
            // TODO: hoeft niet per se zo te zien, de cid/uid wordt ook al bijgehouden door de conenction.close
            case 'newPeer':
                var uid = data.payload.uid;
                var cid = data.payload.cid;
                peers[cid] = uid;
                console.log(peers);
            break;
        }
      }
    }
  });

  connection.on('close', function() {
    var index = connections.indexOf(connection);
    if (index !== -1) {
      // remove the connection from the pool
      connections.splice(index, 1);
      peers.splice(index, 1);
      console.log('removed: '+peers);
      connections.forEach(function(destination) {
        //alert the other peers
        var ci = connections.indexOf(destination);
        destination.sendUTF('{"action":"peerGone","payload":{"peerCid":'+index+',"newCid":'+ci+'}}');
      });
    }
  });
});

// exit if any js file or template file is changed.
// it is ok because this script encapsualated in a batch while(true);
// so it runs again after it exits.
var autoexit_watch=require('./autoexit').watch;

var on_autoexit=function (filename) { } // if it returns false it means to ignore exit this time;  
autoexit_watch(__dirname,".js", on_autoexit);

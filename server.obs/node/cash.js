#!/usr/bin/env node
/* Copyright (c) 2011 by COW Contributors (see AUTHORS for
 * full list of contributors). Published under the MIT license.
 * See https://github.com/Geodan/cow/blob/master/LICENSE for the
 * full text of the license. */
var fs = require('fs');
var WebSocketServer = require('websocket').server;
var http = require('http');
var app_loaded=false;
var port = 8081;
var version = 0.1; //Version number can avoid incompatibilities with data from  older cash servers
var key = 'test'; //A client can decide wether to connect based on the key, to avoid flooding from other sockets 

/** TT:
Added function to get ip-address so we can sent that back to the clients
**/
var
    // Local ip address that we're trying to calculate
    address
    // Provides a few basic operating-system related utility functions (built-in)
    ,os = require('os')
    // Network interfaces
    ,ifaces = os.networkInterfaces();


// Iterate over interfaces ...
for (var dev in ifaces) {

    // ... and find the one that matches the criteria
    var iface = ifaces[dev].filter(function(details) {
        return details.family === 'IPv4' && details.internal === false;
    });

    if(iface.length > 0) address = iface[0].address;
}

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
server.listen(port, function() {
    console.log((new Date()) + ' Server is listening on port ' + port);
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
  //Check which protocols are requested and make sure that the 'connect' protocol is included.
  var protocols = request.requestedProtocols;
  var reject = true;
  for (var i=0; i< protocols.length; i++) {
	if(protocols[i]=="connect") reject = false;
  }
  //If there is no 'connect' protocol requested reject the connection to prevent server crashes
  if(reject) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected due to incompatible protocol.');
	request.reject(501,"Only the 'connect' protocol is supported, sorry!");
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
  peers[ci] = new Date().getTime();
  var servertime = new Date().getTime();
  connection.sendUTF('{"action":"connected","payload":{"peerID":'+peers[ci]+', "server_time":'+servertime+', "server_ip":"'+address+'", "server_key":"'+key+'", "server_version":"'+version+'"}}');
  
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
        
        var index = peers.indexOf(parseInt(data.target));
        if (index !== -1) {
            connections[index].sendUTF(message.utf8Data);
            console.log('target ' + data.target);
        }    
      }
      else {
        connections.forEach(function(destination) {
          destination.sendUTF(message.utf8Data);
        });       
      }
    }
  });

  connection.on('close', function() {
    var index = connections.indexOf(connection);
    if (index !== -1) {
      connections.forEach(function(destination) {
        destination.sendUTF('{"action":"peerGone","payload":{"gonePeerID":'+peers[index]+'}}');
      });
      // remove the connection from the pool
      connections.splice(index, 1);
      peers.splice(index, 1);
    }
  });
	
  });

// exit if any js file or template file is changed.
// it is ok because this script encapsualated in a batch while(true);
// so it runs again after it exits.
var autoexit_watch=require('./autoexit').watch;

var on_autoexit=function (filename) { } // if it returns false it means to ignore exit this time;  
autoexit_watch(__dirname,".js", on_autoexit);

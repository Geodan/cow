_ = require('../../node_modules/underscore/underscore.js')._
Promise = require('../../node_modules/es6-promise').Promise;
Events = require('../../src/events.js');
/**
    !! websocket source code has been changed !!
    node_modules/websocket/lib/WebSocketClient.js, line 251
    rejectUnauthorized: true -> rejectUnauthorized: false
**/
WebSocket = require('websocket').client;
pg = require('pg').native;
Cow = require('../../dist/cow.node.js');

core = new Cow.core({
    herdname: 'test',
    maxage: 1000 * 60 * 60 * 24 * 365 //one year 
});
core.socketservers({
        _id: 'default', 
        //data: {protocol:'ws',ip:'192.168.25.152', port:8081}
        data: {protocol:'wss',ip:'192.168.40.10', port:443,dir: 'icms'}
      });
core.socketserver('default');

core.connect();

core.userStore().loaded.then(function(){
        console.log(core.users().length, ' users loaded');
});
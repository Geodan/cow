_ = require('../../node_modules/underscore/underscore.js')._
Promise = require('../../node_modules/es6-promise').Promise;
Events = require('../../src/events.js');
WebSocket = require('websocket').client;
Cow = require('../../dist/cow.node.js');

core = new Cow.core();
core.socketservers({
        _id: 'default', 
        data: {protocol:'ws',ip:'192.168.3.169', port:8081,dir:'icms'}
      });
core.socketserver('default');
core.connect();

core.userStore().loaded.then(function(){
        console.log('Numusers: ',core.users().length);
});

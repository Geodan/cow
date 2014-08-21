__ = require('../../node_modules/underscore/underscore.js')._
_ = __;
Promise = require('../../node_modules/es6-promise').Promise;
Events = require('../../src/events.js');
WebSocket = require('websocket').client;
Cow = require('../../dist/cow.js');
core = new Cow.core();
core.socketservers({
        _id: 'default', 
        data: {protocol:'ws',ip:'192.168.3.169', port:8081,dir:'icms'}
      });
core.socketserver('default');
core.connect();

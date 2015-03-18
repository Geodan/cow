_ = require('../../node_modules/underscore/underscore.js')._
Promise = require('../../node_modules/es6-promise').Promise;
Events = require('../../src/events.js');
//log = require('../../lib/loglevel/loglevel.min.js');
/**
    !! websocket source code has been changed !!
    node_modules/websocket/lib/WebSocketClient.js, line 251
    rejectUnauthorized: true -> rejectUnauthorized: false
**/
WebSocket = require('websocket').client;
pg = require('pg').native;
//Set global dbUrl
GLOBAL.dbUrl = 'tcp://geodan:Gehijm@192.168.24.15/cow';
Cow = require('./cow.node.js');
//log.setLevel('warn');


core = new Cow.core({
    herdname: 'hhnk',
    maxage: 1000 * 60 * 60 * 24 * 365 //one year 
});
core.socketservers({
        _id: 'default', 
        data: {protocol:'wss',ip:'192.168.40.10', port:443,dir: 'hhnk'}
      });
core.socketserver('default');

core.connect().then(function(){
        console.log('yes!');
        core.peer().data('superpeer', true).sync();
});

core.userStore().loaded.then(function(){
        console.log(core.users().length, ' users loaded');
});

core.projectStore().loaded.then(function(){
        console.log(core.projects().length, ' projects loaded');
        console.log('My peerid: ', core.peerid()); //dirty hack
        core.peer().data('superpeer', true).sync();
});




/** TODO

- Catch errors
- Try reconnect on postgres disconnect 
- Debug

**/
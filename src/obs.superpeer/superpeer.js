configfile = process.argv[2];
//Enable full path
config = require(configfile);

_ = require('../node_modules/underscore/underscore.js')._
Promise = require('../node_modules/es6-promise').Promise;
Events = require('../src/events.js');

WebSocket = require('websocket').client;
pg = require('pg').native;
//Set global dbUrl
GLOBAL.dbUrl = config.dbUrl;
//Set env var to accept all certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
Cow = require('../../dist/cow.node.js');


core = new Cow.core({
    herdname: config.herdname,
    maxage: 1000 * 60 * 60 * 24 * 365 //one year 
});
core.socketservers({
        _id: 'default', 
        data: {
        	protocol: config.protocol,
        	ip: config.ip, 
        	port: config.port,
        	dir: config.dir}
      });
core.socketserver('default');
core.connect();
core.userStore().loaded.then(function(){
	console.log(core.users().length, ' users loaded');
});

core.projectStore().loaded.then(function(){
	console.log(core.projects().length, ' projects loaded');
	core.peer().data('superpeer', true).sync();
	console.log('My peerid: ', core.peerid());
});
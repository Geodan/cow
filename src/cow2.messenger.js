(function(){

var root = this;
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Cow || {};
    }
    exports.Cow = Cow || {}; 
} else {
    root.Cow = Cow || {};
}

Cow.messenger = function(config){
    this._core = config.core;
    this._numreqs = 0;
    this._amountreq = 0;
    this._sendhistory = [];
    this._amountsendhistory = [];
    this._numsends = 0;
    this._amountsend = 0;
    this._reqhistory = [];
    this._amountreqhistory = [];
    this.ws = this._core.websocket();
    this.ws.on('message',this._onMessage);
    this.ws.on('error', this._onError);
    var self = this;
    var maxloglength = 60;
    //Calculate throughput
    setInterval(function(){
        self._sendhistory.push(self._numsends);
        self._amountsendhistory.push(self._amountsend);
        if (self._sendhistory.length > maxloglength){
            self._sendhistory.shift();
            self._amountsendhistory.shift();
        }
        self._reqhistory.push(self._numreqs);
        self._amountreqhistory.push(self._amountreq);
        if (self._reqhistory.length > maxloglength){
            self._reqhistory.shift();
            self._amountreqhistory.shift();
        }
        self._numsends = 0;
        self._amountsend = 0;
        self._numreqs = 0;
        self._amountreq = 0;
    },1000);
};

/**
    activitylog() - returns activity log object
**/
Cow.messenger.prototype.activitylog = function(){
    return {
        reqhistory: this._reqhistory,
        sendhistory: this._sendhistory,
        amountreqhistory: this._amountreqhistory,
        amountsendhistory: this._amountsendhistory
    };
};

    /**
        sendData(data, action, target) - send data to websocket server with params:
            data - json object
            action - string that describes the context of the message
            target - (optional) id of the target peer
    **/
Cow.messenger.prototype.sendData = function(data, action, target){
    //TODO: check if data is an object
    var message = {};        
    message.sender = this._core.peerid();
    message.target = target;
    message.action = action;
    message.payload = lzwCompress.pack(data);
    var stringified;
    var endcoded;
    try {
        stringified = JSON.stringify(message);
    }
    catch (e){
        console.error(e, message);
    }
    this.ws.send(stringified);
    this._numsends++;
    this._amountsend = +stringified.length;
};

Cow.messenger.prototype._onError = function(error){
	//TODO: propagate
};

Cow.messenger.prototype._onMessage = function(message){
    var core = this._core;
    var data = JSON.parse(message.data); //TODO: catch parse errors
    var sender = data.sender;
    var PEERID = core.peerid(); 
    var action = data.action;        
    if (data.action == 'connected'){
		data.payload = data.payload;
    }
    else {
    	try {
    		data.payload = lzwCompress.unpack(data.payload);
    	}
    	catch(e){
    		this.trigger('notice','Error in lzwCompress ' + e);
    	}
    }
    var payload = data.payload;
    var target = data.target;
    if (sender != PEERID){
        this._core.messenger()._numreqs++;
        this._core.messenger()._amountreq = +message.data.length;
    }
    switch (action) {
    /**
        Commands 
    **/
        case 'command':
            if (sender != PEERID){
                this._core.messenger()._onCommand(data);
            }
        break;
    /**
        Messages related to the websocket connection
    **/
        //websocket confirms connection by returning the unique peerID (targeted)
        case 'connected':
            this._core.messenger()._onConnect(payload);
        break;
        
        //messenger tells everybody a peer has gone, with ID: peerID
        case 'peerGone':
            this._core.messenger()._onPeerGone(payload);
        break;      
    
    /**
        Messages related to the syncing protocol
    **/
        //a new peer has arrived and gives a list of its records
        case 'newList':
            if(sender != PEERID) {
                this._core.messenger()._onNewList(payload,sender);
            }
        break;
        //you just joined and you receive info from the alpha peer on how much will be synced
        case 'syncinfo':
            if(sender != PEERID) {
                this._core.messenger()._onSyncinfo(payload,sender);
            }
        break;
        //you just joined and you receive a list of records the others want (targeted)
        case 'wantedList':
            if(target == PEERID) {
                this._core.messenger()._onWantedList(payload);
            }
        break;
        
        //you just joined and receive the records (one by one)  you are missing (targeted)
        case 'missingRecord':
            if(target == PEERID) {
                this._core.messenger()._onMissingRecord(payload);
            }   
        break;
        
        //a new peer has arrived and sends everybody the records (one by one) that are requested in the *wantedList*
        case 'requestedRecord':
            if(sender != PEERID) {
                this._core.messenger()._onMissingRecord(payload);
            }
        break;
        
    /**
        Messages related to real-time changes in records
    **/
        //a peer sends a new or updated record
        case 'updatedRecord':
            if(sender != PEERID) {
                this._core.messenger()._onUpdatedRecord(payload);
            }
        break;
        
    }
    
};

/**
_onConnect handles 2 things
    1) some checks to see if the server connection is ok. (time diff and key)
    2) initiate the first sync of the stores
**/

Cow.messenger.prototype._onConnect = function(payload){
    this._connected = true;
    var self = this;
    this._core.peerid(payload.peerID);
    var mypeer = this._core.peers({_id: payload.peerID});
    var version = payload.server_version;
    var serverkey = payload.server_key;
    var servertime = payload.server_time;
    var now = new Date().getTime();
    var maxdiff = 1000 * 60 * 5; //5 minutes
    if (Math.abs(servertime - now) > maxdiff){
        self.trigger('notice','Time difference between server and client larger ('+Math.abs(servertime-now)+'ms) than allowed ('+maxdiff+' ms).');
        self.ws.disconnect();
        return;
    }
            
    if (serverkey !== undefined && serverkey != this._core._herdname){
        self.trigger('notice','Key on server ('+serverkey+') not the same as client key ('+this._core._herdname+').');
        self.ws.disconnect();
        return;
    }
        
    //add userid to peer object
    if (this._core.user()){
        mypeer.data('userid',this._core.user().id());
    }
    mypeer.data('version',this._core.version());
    mypeer.deleted(false).sync();
    this.trigger('connected',payload);

    //Put all load promises together
    var promisearray = [
        this._core.socketserverStore().loaded,
        this._core.peerStore().loaded,
        this._core.userStore().loaded,
        this._core.projectStore().loaded
    ];
    //Add the itemstore/groupstore load promises
    Promise.all(promisearray).then(function(){
        var projects = self._core.projects();
        var loadarray = [];
        for (var i=0;i<projects.length;i++){
            var project = projects[i];
            //Only sync items and groups in non-deleted projects
            if (!project.deleted()){
				loadarray.push([
					project.itemStore().loaded,
					project.groupStore().loaded
				]);
            }
        }
        Promise.all(loadarray).then(syncAll);
    });
    
    syncarray = [
        this._core.socketserverStore().synced,
        this._core.peerStore().synced,
        this._core.userStore().synced,
        this._core.projectStore().synced
    ];
    
    //After all idb's are loaded, start syncing process
    function syncAll(){
        console.log('Starting sync');
        self._core.projectStore().sync();
        self._core.socketserverStore().sync();
        self._core.peerStore().sync();
        self._core.userStore().sync();
        self._core.projectStore().synced.then(function(){
            var projects = self._core.projects();
            for (var i=0;i<projects.length;i++){
                var project = projects[i];
                //Only sync items and groups in non-deleted projects
                if (!project.deleted()){
					syncarray.push([project.itemStore().synced,project.groupStore().synced]); 
					project.itemStore().sync();
					project.groupStore().sync();
				}
            }
            Promise.all(syncarray).then(function(d){
                console.log('all synced');
            });
        });
    }
};
    
    
    //A peer has disconnected, remove it from your peerList
Cow.messenger.prototype._onPeerGone = function(payload) {
    var peerGone = payload.gonePeerID.toString();
    if (this._core.peers(peerGone)){
        this._core.peers(peerGone).deleted(true).sync();
    }
    this._core.peerStore().pruneDeleted();        
    //TODO this.core.trigger('ws-peerGone',payload); 
};

Cow.messenger.prototype._getStore = function(payload){
    var storetype = payload.syncType;
    var projectid = payload.project ? payload.project.toString() : null;
    var project;
    switch (storetype) {
        case 'peers':
            return this._core.peerStore();
        case 'socketservers':
            return this._core.socketserverStore();
        case 'projects':
            return this._core.projectStore();
        case 'users':
            return this._core.userStore();
        case 'items':
            if (!projectid) {
                throw('No project id given');
            }
            if (this._core.projects(projectid)){
                project = this._core.projects(projectid);
            }
            else {
                throw "No project with id "+projectid+" Indexeddb too slow with loading?";
            }
            return project.itemStore();
        case 'groups':
            if (!projectid) {
                throw('No project id given');
            }
            if (this._core.projects(projectid)){
                project = this._core.projects(projectid);
            }
            else {
                throw "No project with id "+projectid+" Indexeddb too slow with loading?";
            }
            return project.groupStore();
    }
};
    
//A peer initiates a sync
Cow.messenger.prototype._onNewList = function(payload,sender) {
    var self = this;
    //Only answer if we are the alpha peer
    if (this._amIAlpha()){
        var store = this._getStore(payload);
        var project = store._projectid;
        //Find out what should be synced
        var syncobject = store.compareRecords({uid:sender, list: payload.list});
        var data;
        //Give the peer information on what will be synced
        var syncinfo = {
            IWillSent: _.pluck(syncobject.pushlist,"_id"),
            IShallReceive: syncobject.requestlist //TODO: hey, this seems like doubling the functionality of 'wantedList'
        };
        data = {
            "syncType" : payload.syncType,
            "project" : project,
            "syncinfo" : syncinfo
        };
        this.sendData(data, 'syncinfo',sender);
        
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.requestlist
        };
        //Don't send empty lists
        if (syncobject.requestlist.length > 0){
            this.sendData(data, 'wantedList', sender);
        }
        
        syncobject.pushlist.forEach(function(d){
            msg = {
                "syncType" : payload.syncType,
                "project" : project,
                "record" : d
            };
            self.sendData(msg, 'missingRecord', sender);
        });
    }
};
Cow.messenger.prototype._amIAlpha = function(){ //find out wether I am alpha
    var returnval = null;
    var alphapeer = this._core.alphaPeer();
    var me = this._core.peer();
    if (me.id() == alphapeer.id()) {//yes, I certainly am (the oldest) 
        returnval =  true;
    }
    else { 
        returnval = false; //Not the oldest in the project
    }
    return returnval;
};

Cow.messenger.prototype._onSyncinfo = function(payload) {
    var store = this._getStore(payload);
    store.syncinfo.toReceive = payload.syncinfo.IWillSent;
    store.syncinfo.toSent = payload.syncinfo.IShallReceive;
    if (store.syncinfo.toReceive.length < 1){
    	store.trigger('synced');
    }
};

Cow.messenger.prototype._onWantedList = function(payload) {
    var self = this;
    var store = this._getStore(payload);
    var returnlist = store.requestRecords(payload.list);
    returnlist.forEach(function(d){
		msg = {
			"syncType" : payload.syncType,
			"project" : store._projectid,
			"record" : d
		};
		self.sendData(msg, 'requestedRecord');
    });
    //TODO this.core.trigger('ws-wantedList',payload); 
};
/*OBS - kept for reference    
Cow.messenger.prototype._onMissingRecords = function(payload) {
    var store = this._getStore(payload);
    var list = payload.list;
    var synclist = [];
    var i;
    
    for (i=0;i<list.length;i++){
        var data = list[i];
        var record = store._addRecord({source: 'WS', data: data});
        
        //Do the syncing for the deltas
        if (data.deltas && record.deltas()){
            var localarr = _.pluck(record.deltas(),'timestamp');
            var remotearr = _.pluck(data.deltas,'timestamp');
            var diff = _.difference(localarr, remotearr);
            //TODO: nice solution for future, when dealing more with deltas
            //For now we just respond with a forced sync our own record so the delta's get synced anyway
            if (diff.length > 0){
                synclist.push(record);
            }
        }
    }
    //After doing all the _addRecord to the store, now we should commit the queue
    store._commit();
    store.trigger('synced');
    for (i=0;i<synclist.length;i++){
        store.syncRecord(synclist[i]);
    }
    store.trigger('datachange');
    
};
*/
/* Alternative for missingRecods */
Cow.messenger.prototype._onMissingRecord = function(payload) {
    var store = this._getStore(payload);
    var synclist = [];
    var i;
	var data = payload.record;
	var record = store._addRecord({source: 'WS', data: data});
	store._commit(); //TODO: we want to do the commit after *all* missingRecords arrived
	store.trigger('datachange');
	//TODO: _.without might not be most effective way to purge an array
    store.syncinfo.toReceive = _.without(store.syncinfo.toReceive,data._id);
    //If there is no more records to be received we can trigger the synced
    if (store.syncinfo.toReceive.length < 1){
    	store.trigger('synced');
    }
	//Do the syncing for the deltas
	if (data.deltas && record.deltas()){
		var localarr = _.pluck(record.deltas(),'timestamp');
		var remotearr = _.pluck(data.deltas,'timestamp');
		var diff = _.difference(localarr, remotearr);
		//TODO: nice solution for future, when dealing more with deltas
		//For now we just respond with a forced sync our own record so the delta's get synced anyway
		if (diff.length > 0){
			store.syncRecord(record);
		}
	}
};
  
Cow.messenger.prototype._onUpdatedRecord = function(payload) {
    var store = this._getStore(payload);
    var data = payload.record;
    store._addRecord({source: 'WS', data: data});
    //After doing the _addRecord to the store, now we should commit the queue
    store._commit();
    store.trigger('datachange');
};
    // END Syncing messages
    
    
    /**
        Command messages:
            commands are ways to control peer behaviour.
            Commands can be targeted or non-targeted. Some commands are handled here (all purpose) but all commands
            will send a trigger with the command including the message data.
    **/
Cow.messenger.prototype._onCommand = function(data) {
    var core = this._core;
    var payload = data.payload;
    var command = payload.command;
    var target = payload.target;
    var params = payload.params;
    this.trigger('command',data);
    
    //Disconnects a (misbehaving or stale) peer
    if (command == 'kickPeer'){
        if (data.target == core.peerid()){
            core.socketserver('invalid');
            core.disconnect();
        }
    }
    //Remove all data from a peer
    if (command == 'purgePeer'){
        if (target && target == this._core.peerid()){
            core.projects().forEach(function(d){
                d.itemStore().clear();
                d.groupStore().clear();
            });
            core.projectStore().clear();
            core.userStore().clear();
        }
    }
    //Close project and flush the items and groups in the project (use with utter caution!) 
    if (command == 'flushProject'){
        var projectid = payload.projectid;
        var project;
        if (core.projects(projectid)){
            project = core.projects(projectid);
            project.itemStore().clear(); //remove objects from store and db
        }
    }
    //Answer a ping with a pong
    if (command == 'ping'){
        this.sendData({command: 'pong'},'command',data.sender);
    }
};

//Adding some Backbone event binding functionality to the store
_.extend(Cow.messenger.prototype, Events);
}.call(this));
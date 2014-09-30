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
    message.payload = data;
    var stringified;
    try {
        stringified = JSON.stringify(message);
    }
    catch (e){
        console.error(e, message);
    }
    //console.info('Sending ' + JSON.stringify(message));
    this.ws.send(stringified);
    this._numsends++;
    this._amountsend = +stringified.length;
};

Cow.messenger.prototype._onMessage = function(message){
    var core = this._core;
    var data = JSON.parse(message.data); //TODO: catch parse errors
    var sender = data.sender;
    var PEERID = core.peerid(); 
    var action = data.action;        
    var payload = data.payload;    
    var target = data.target;
    if (sender != PEERID){
        //console.info('Receiving '+JSON.stringify(data));
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
        
        //you just joined and receive the records you are missing (targeted)
        case 'missingRecords':
            if(target == PEERID) {
                this._core.messenger()._onMissingRecords(payload);
            }   
        break;
        
        //a new peer has arrived and sends everybody the records that are requested in the *wantedList*
        case 'requestedRecords':
            if(sender != PEERID) {
                this._core.messenger()._onMissingRecords(payload);
                //OBS: this._onRequestedRecords(payload);
            }
        break;
    /**
        Messages related to real-time changes in records
    **/
        //a peer sends a new or updated record
        case 'updatedRecord':
            if(sender != PEERID) {
                this._core.messenger()._onUpdatedRecords(payload);
            }
        break;
        
    }
    
};

Cow.messenger.prototype._onConnect = function(payload){
    console.log('connected!');
    this._connected = true;
    var self = this;
    this._core.peerid(payload.peerID);
    var mypeer = this._core.peers({_id: payload.peerID});
    var version = payload.server_version;
    var serverkey = payload.server_key;
    
    if (serverkey !== undefined && serverkey != this._core._herdname){
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
    
    //initiate socketserver sync
    this._core.socketserverStore().sync();
    
    //initiate peer sync
    this._core.peerStore().sync();

    //initiate user sync
    this._core.userStore().sync();
    
    //initiate project sync
    var projectstore = this._core.projectStore();
    projectstore.sync();
    
    //wait for projectstore to load
    projectstore.loaded.then(function(d){
        var projects = self._core.projects();
        for (var i=0;i<projects.length;i++){
            var project = projects[i];
            self._core.projects(project._id).itemStore().sync();
            self._core.projects(project._id).groupStore().sync();
        }
    });
};
    
    
    //A peer has disconnected, remove it from your peerList
Cow.messenger.prototype._onPeerGone = function(payload) {
    var peerGone = payload.gonePeerID.toString();
    if (this._core.peers(peerGone)){
        this._core.peers(peerGone).deleted(true).sync();
    }
    //this._core.peerStore().removePeer(peerGone);        
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
                project = this._core.projects({_id:projectid});
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
                project = this._core.projects({_id:projectid});
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
            IShallReceive: _.pluck(syncobject.requestlist,"_id") //TODO: hey, this seems like doubling the functionality of 'wantedList'
        };
        data = {
            "syncType" : payload.syncType,
            "project" : project,
            "syncinfo" : syncinfo
        };
        //Don't send empty lists
        if (syncobject.requestlist.length > 0 && syncobject.pushlist.length > 0){
            this.sendData(data, 'syncinfo',sender);
        }
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.requestlist
        };
        //Don't send empty lists
        if (syncobject.requestlist.length > 0){
            this.sendData(data, 'wantedList', sender);
        }
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.pushlist
        };
        /* TT: This was used because IIS/signalR couldn't handle large chunks in websocket.
        Therefore we sent the records one by one. This slows down the total but should be 
        more stable 
        
        _(data.list).each(function(d){
            msg = {
                "syncType" : payload.syncType,
                "project" : project,
                "record" : d
            };
            self.sendData(msg, 'updatedRecord', sender);
        });
        */
        //Don't send empty lists
        if (syncobject.pushlist.length > 0){
            this.sendData(data, 'missingRecords', sender);
        }
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
};

Cow.messenger.prototype._onWantedList = function(payload) {
    var self = this;
    var store = this._getStore(payload);
    var returnlist = store.requestRecords(payload.list);
    var data =  {
        "syncType" : payload.syncType,
        "project" : store._projectid,
        "list" : returnlist
    };
    /* TT: This was used because IIS/signalR couldn't handle large chunks in websocket.
        Therefore we sent the records one by one. This slows down the total but should be 
        more stable 
    _(data.list).each(function(d){
        msg = {
            "syncType" : payload.syncType,
            "project" : store._projectid,
            "record" : d
        };
        self.sendData(msg, 'updatedRecord');
    });
    */
    this.sendData(data, 'requestedRecords');
    //TODO this.core.trigger('ws-wantedList',payload); 
};
    
Cow.messenger.prototype._onMissingRecords = function(payload) {
    var store = this._getStore(payload);
    var list = payload.list;
    var synclist = [];
    var i;
    for (i=0;i<list.length;i++){
        var data = list[i];
        //var record = store._addRecord({source: 'WS', data: data});
        var record = store._addRecord({source: 'WS', data: data});
        //if we receive a new project, we also have to get the items and groups in it
        if (store._type == 'projects'){
            record.groupStore().sync();
            record.itemStore().sync();
        }
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
    for (i=0;i<synclist.length;i++){
        store.syncRecord(synclist[i]);
    }
    store.trigger('datachange');
};
  
Cow.messenger.prototype._onUpdatedRecords = function(payload) {
    var store = this._getStore(payload);
    var data = payload.record;
    store._addRecord({source: 'WS', data: data});
    //TODO: _.without might not be most effective way to purge an array
    store.syncinfo.toReceive = _.without(store.syncinfo.toReceive,data._id); 
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
    var targetuser = payload.targetuser;
    var params = payload.params;
    this.trigger('command',data);
    //TODO: move to icm
    if (command == 'zoomTo'){
        if (targetuser && targetuser == core.user().id()){
            this.trigger(command, payload.location);
        }
    }
    //Closes a (misbehaving or stale) peer
    if (command == 'kickPeer'){
        if (targetuser && targetuser == core.peerid()){
            //TODO: make this more gentle, possibly with a trigger
            window.open('', '_self', ''); 
            window.close();
        }
    }
    //Remove all data from a peer
    if (command == 'purgePeer'){
        if (targetuser && targetuser == this._core.peerid()){
            _.each(core.projects(), function(d){
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
        var target = data.sender;
        this.sendData({command: 'pong'},'command',target);
    }
};

//Adding some Backbone event binding functionality to the store
_.extend(Cow.messenger.prototype, Events);
}.call(this));
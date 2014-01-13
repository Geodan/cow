window.Cow = window.Cow || {};

Cow.websocket = function(config){
    this._core = config.core;
    //socket connection object
    this._url = config.url;
    this._connection = this.connect(this._url);
};


Cow.websocket.prototype = {
    /**
        disconnect() - disconnect us from websocket server
    **/
    disconnect: function() {
        if (this._connection){
            this._connection.close();    
            this._connection = null;
        }
        else { 
            throw('No websocket active');
        }
    },
    /**
        connect(url) - connect to websocket server on url, returns connection
    **/
    connect: function(url) {
        var core = this.core;
        if (!this._connection || this._connection.readyState != 1) //if no connection
        {
            if(url.indexOf('ws') === 0) {
                var connection = new WebSocket(this._url, 'connect');
                connection.onopen=this._onOpen;
                connection.onmessage = this._onMessage;
                connection.onclose = this._onClose;    
                connection.onerror = this._onError;
                connection.obj = this;
            }
            else {throw('Incorrect URL: ' + url);}
        }
        else {
            connection = this._connection;
        }
        return connection;
    },
    /**
        connection() - returns connection object
    **/
    connection: function(){
        return this._connection;
    },    
    /**
        sendData(data, action, target) - send data to websocket server with params:
            data - json object
            action - string that describes the context of the message
            target - (optional) id of the target peer
    **/
    sendData: function(data, action, target){
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
        if (this._connection && this._connection.readyState == 1){
            this._connection.send(JSON.stringify(message));
        }
    },
    _onMessage: function(message){
        
        var core = this.obj._core;
        var data = JSON.parse(message.data); //TODO: catch parse errors
        var sender = data.sender;
        var PEERID = core.peerid(); 
        var action = data.action;        
        var payload = data.payload;    
        var target = data.target;
        console.log('COW2 :',data.action);
        switch (action) {
        /**
            Commands 
        **/
            case 'command':
                if (sender != PEERID){
                    this.obj._onCommand(payload);
                }
            break;
        /**
            Messages related to the websocket connection
        **/
            //websocket confirms connection by returning the unique peerID (targeted)
            case 'connected':
                this.obj._onConnect(payload);
            break;
            
            //websocket tells everybody a peer has gone, with ID: peerID
            case 'peerGone':
                this.obj._onPeerGone(payload);
            break;      
        
        /**
            Messages related to the syncing protocol
        **/
            //a new peer has arrived and gives a list of its records
            case 'newList':
                if(sender != PEERID) {
                    this.obj._onNewList(payload,sender);
                }
            break;
            
            //you just joined and you receive a list of records the others want (targeted)
            case 'wantedList':
                if(target == PEERID) {
                    this.obj._onWantedList(payload);
                }
            break;
            
            //you just joined and receive the records you are missing (targeted)
            case 'missingRecords':
                if(target == PEERID) {
                    this.obj._onMissingRecords(payload);
                }   
            break;
            
            //a new peer has arrived and sends everybody the records that are requested in the *wantedList*
            case 'requestedRecords':
                if(sender != PEERID) {
                    this.obj._onRequestedRecords(payload);
                }
            break;
        /**
            Messages related to real-time changes in records
        **/
            //a peer sends a new or updated record
            case 'updatedRecord':
                if(sender != PEERID) {
                    this.obj._onUpdatedRecords(payload);
                }
            break;
            
        }
        
    },
    _onClose: function(event){
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;
        var self = this;
        //this.close(); //FIME: TT: why was this needed?
        this.obj._core.peerStore().clear();
        //TODO this.obj._core.trigger('ws-disconnected');    
        var restart = function(){
            try{
                self.obj._core.websocket().disconnect();
            }
            catch(err){
                console.warn(err);
            }
            var url = self.obj._url;
            self.obj._connection = self.obj._core.websocket().connect(url);
        };
        setTimeout(restart,5000);
    },
    _onConnect: function(payload){
        var self = this;
        this._core.peerid(payload.peerID);
        var mypeer = this._core.peers({_id: payload.peerID});
        //add userid to peer object
        if (core.user()){
            mypeer.data('userid',core.user()._id);
        }
        mypeer.sync();
        //TODO this.core.trigger('ws-connected',payload);
        
        //initiate peer-sync
        var message = {};
        message.syncType = 'peers';
        //We can immediately use the peerStore here because it's not depending on a slow loading indexeddb
        message.list = this._core.peerStore().idList();
        this.sendData(message, 'newList');
        
        var startsync = function(synctype, store){
            //TODO: when there's no _db object, syncing should start immediately (like peers store)
            store.initpromise.then(function(d){
                var message = {};
                message.syncType = synctype;
                message.project = store._projectid;
                message.list = store.idList();
                self.sendData(message, 'newList');
            });
        };
        

        //initiate project sync
        var store1 = this._core.projectStore();
        startsync('projects', store1);
        
        //initiate user sync
        var store2 = this._core.userStore();
        startsync('users', store2);
        
        //wait for projectstore to load
        store1.initpromise.then(function(d){
            var projects = self._core.projects();
            for (var i=0;i<projects.length;i++){
                var project = projects[i];
                store = self._core.projects(project._id).itemStore(); 
                startsync('items', store);
                store = self._core.projects(project._id).groupStore(); 
                startsync('groups', store);
            }
        });
    },
    
    
    //A peer has disconnected, remove it from your peerList
    _onPeerGone: function(payload) {
        var peerGone = payload.gonePeerID;
        this._core.peers(peerGone).deleted(true).sync();
        //this._core.peerStore().removePeer(peerGone);        
        //TODO this.core.trigger('ws-peerGone',payload); 
    },
    _onError: function(e){
        console.warn('error in websocket connection: ' + e.type);
    },
    _getStore: function(payload){
        var storetype = payload.syncType;
        var projectid = payload.project;
        var project;
        switch (storetype) {
            case 'peers':
                return this._core.peerStore();
            case 'projects':
                return this._core.projectStore();
            case 'users':
                return this._core.userStore();
            case 'items':
                if (!projectid) {throw('No project id given');}
                project = this._core.projects(projectid);
                return project.itemStore();
            case 'groups':
                if (!projectid) {throw('No project id given');}
                project = this._core.projects(projectid);
                return project.groupStore();
        }
    },
    
    //A peer initiates a sync
    _onNewList: function(payload,sender) {
        //TODO: alphapeer check
        
        var store = this._getStore(payload);
        var project = store._projectid;
        var syncobject = store.compareRecords({uid:sender, list: payload.list});
        var data;
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.requestlist
        };
        this.sendData(data, 'wantedList', sender);
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.pushlist
        };
        this.sendData(data, 'missingRecords', sender);
        //TODO this.core.trigger('ws-newList',message); 
    },
    
    _onWantedList: function(payload) {
        var store = this._getStore(payload);
        var returnlist = store.requestRecords(payload.list);
        var data =  {
            "syncType" : payload.syncType,
            "project" : store._projectid,
            "list" : returnlist
        };
        this.sendData(data, 'requestedRecords');
        //TODO this.core.trigger('ws-wantedList',payload); 
    },
    
    _onMissingRecords: function(payload) {
        var store = this._getStore(payload);
        var list = payload.list;
        for (var i=0;i<list.length;i++){
            var data = list[i];
            store._addRecord({source: 'WS', data: data});
        }
        //TODO this.core.trigger('ws-missingRecords',payload); 
    },
    
    _onRequestedRecords: function(payload) {
        var store = this._getStore(payload);
        var list = payload.list;
        for (var i=0;i<list.length;i++){
            var data = list[i];
            store._addRecord({source: 'WS', data: data});
        }
        //TODO this.core.trigger('ws-onRequestedRecords',payload); 
    },
    
    _onUpdatedRecords: function(payload) {
        var store = this._getStore(payload);
        var data = payload.record;
        store._addRecord({source: 'WS', data: data});
        //TODO this.core.trigger('ws-onRequestedRecords',payload); 
    },
    // END Syncing messages
    
    //Command messages:
    _onCommand: function(payload) {
        var command = payload.command;
        var targetuser = payload.targetuser;
        console.log('Command received: ',command);
        if (command == 'zoomTo'){
            if (targetuser && targetuser == this._core.user().id()){
                this.trigger(command, payload.location);
            }
        }
        if (command == 'killPeer'){
            if (targetuser && targetuser == this._core.peerid()){
                //TODO: make this more gentle, possibly with a trigger
                window.open('', '_self', ''); 
                window.close();
            }
        }
    }
    
};
//Adding some Backbone event binding functionality to the store
_.extend(Cow.websocket.prototype, Events);

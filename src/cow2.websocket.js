window.Cow = window.Cow || {};
//TODO: complete rewrite from cow.websocket.js and core.js
Cow.websocket = function(config){
    this._core = config.core;
    //socket connection object
    this._url = config.url;
    this._connection = this.connect(this._url);
};

Cow.websocket.prototype = {
    disconnect: function() {
        if (this._connection){
            this._connection.close();    
            this._connection = null;
        }
        else { 
            throw('No websocket active');
        }
    },
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
                connection.obj = this; //TT: Why is this?
            }
            else {throw('Incorrect URL: ' + url);}
        }
        else {
            connection = this._connection;
        }
        return connection;
    },
    connection: function(){
        return this._connection;
    },    
    sendData: function(data, action, target){
        console.log('COW2 sendData: ', data);
        //TODO: check if data is an object
        var message = {};        
        message.sender = this._core.peerid();
        message.target = target;
        message.action = action;
        message.payload = data;
        if (this._connection && this._connection.readyState == 1){
            this._connection.send(JSON.stringify(message));
        }
    },
    _onMessage: function(message){
        console.log('COW2 :',message.data);
        var core = this.obj._core;
        var data = JSON.parse(message.data); //TODO: catch parse errors
        var sender = data.sender;
        var PEERID = core.peerid(); 
        var action = data.action;        
        var payload = data.payload;    
        var target = data.target;
        switch (action) {
        //Messages related to the websocket connection
            //websocket confirms connection by returning the unique peerID (targeted)
            case 'connected':
                this.obj._onConnect(payload);
            break;
            
            //websocket tells everybody a peer has gone, with ID: peerID
            case 'peerGone':
                this.obj._onPeerGone(payload);
            break;      
        
        //Messages related to the syncing protocol
            //a new peer has arrived and gives a list of its items
            case 'newList':
                if(sender != PEERID) {
                    this.obj._onNewList(payload,sender);
                }
            break;
            
            //you just joined and you receive a list of items the others want (targeted)
            case 'wantedList':
                if(target == PEERID) {
                    this.obj._onWantedList(payload);
                }
            break;
            
            //you just joined and receive the items you are missing (targeted)
            case 'missingItems':
                if(target == PEERID) {
                    this.obj._onMissingItems(payload);
                }   
            break;
            
            //a new peer has arrived and sends everybody the items that are requested in the *wantedList*
            case 'requestedItems':
                if(sender != PEERID) {
                    this.obj._onRequestedItems(payload);
                }
            break;
            
        }
        //TODO
    },
    _onClose: function(event){
        var code = event.code;
        var reason = event.reason;
        var wasClean = event.wasClean;
        var self = this;
        //this.close(); //FIME: TT: why was this needed?
        //TODO this.obj._core.removeAllPeers();
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
        this._core.peerid(payload.peerID);
        var peer = new Cow.peer({_id: payload.peerID});
        var me = this._core.peerStore().addPeer({source: 'UI', data: peer.deflate()});
        //TODO this.core.trigger('ws-connected',payload); 
        //initiate peer-sync
        var message = {};
        message.syncType = 'peers';
        //We can immediately use the peerStore here because it's not depending on a slow loading indexeddb
        message.list = this._core.peerStore().idList();
        this.sendData(message, 'newList');
    },
    //A peer has disconnected, remove it from your peerList
    _onPeerGone: function(payload) {
        var peerGone = payload.gonePeerID;    
        this._core.peerStore().removePeer(peerGone);        
        //TODO this.core.trigger('ws-peerGone',payload); 
    },
    _onError: function(e){
        console.warn('error in websocket connection: ' + e.type);
    },
    //A peer initiates a sync
    _onNewList: function(payload,sender) {
        //TODO: alphapeer check
        
        var message = {};
        message.sender = sender;
        message.payload = payload;
        var listtype = payload.syncType;
        var store;
        switch (payload.syncType) {
            case 'peers': //peers is a little different, there's only 1 peer per time
                store = this._core.peerStore();
            break;
            case 'projects':
                store = this._core.projectStore();
            break;
            //TODO add all stores
        }
        var syncobject = store.syncRecords({uid:sender, list: payload.list});
        var data =  {
            "syncType" : payload.syncType,
            "list" : syncobject.requestlist
        };
        this.sendData(data, 'wantedList', sender);
        data =  {
            "syncType" : payload.syncType,
            "list" : syncobject.pushlist
        };
        this.sendData(data, 'missingList', sender);
        //TODO this.core.trigger('ws-newList',message); 
    },
    
    _onWantedList: function(payload) {
        
        //TODO this.core.trigger('ws-wantedList',payload); 
    },
    
    _onMissingItems: function(payload) {
        //TODO this.core.trigger('ws-missingItems',payload); 
    },
    
    _onRequestedItems: function(payload) {
        //TODO this.core.trigger('ws-onRequestedItems',payload); 
    }
    // END Syncing messages
};

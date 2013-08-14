$.Cow.Websocket.prototype = {
    
    _onOpen: function() {
        
        console.log('connected');
    },
    _onMessage: function(message) {
        var core = this.obj.core;
        console.debug('message: '+message.data);
        var data = JSON.parse(message.data);
        var uid = data.uid;
        var UID = core.UID; 
        var action = data.action;        
        var payload = data.payload;    
        var target = data.target;
        switch (action) {
        //Messages from Server
            //webscocket confirms connection by returning a CID
            case 'connected':
                this.obj._onConnect(payload)
            break;
            //the server noticed a peer disconnecting and send its connection-id to the pool
            case 'peerGone':
                this.obj._onPeerGone(payload);
            break;            
        //Messages from Peers: targeted messages
            //the client has joined and receives the status from peers: connection-id, uid, extent
            case 'informPeer':
                if(target == this.obj.core.UID) {
                    this.obj._onInformPeer(payload,uid);
                }
            break;
            //the alpha peer sends a sync message with new features and a feature request
            case 'syncPeer':
                if(target == this.obj.core.UID) {
                    this.obj._onSyncPeer(payload,uid);
                }
            break;
            //requested feats are returning from peer
            case 'requestedFeats':
                if(uid != UID) {
                    this.obj._onRequestedFeats(payload,uid);
                }
            break;
            
                
        //Messages from Peers: broadcasted messages
            //a peer is gone and everybody has a new connection-id, recieve a connectionID with UID
            case 'updatePeers':
                if(uid != UID) {            
                    this.obj._onUpdatePeers(payload,uid);
                }
            break;
            //a new peer just joined, recieve its status: connection-id, uid, extent
            case 'newPeer':
                if(uid != this.obj.core.UID) {
                    this.obj._onNewPeer(payload,uid);
                }
            break;
            //a new peer just sent it's fidlist
            case 'newPeerFidList':
                if(uid != this.obj.core.UID) {
                    this.obj._onNewPeerFidList(payload,uid);
                }
            break;
            //a peer has changed, update the peer
            case 'peerUpdated':
                if(uid != UID) {
                    this.obj._onPeerUpdated(payload,uid);
                }
            break;
            //a new object was drawn or updated by a peer
            case 'newFeature':
                if(uid != UID) {
                    var item = JSON.parse(payload);
                    if (self.core.activeherd() == item.feature.properties.store)
                        core.featurestore().updateItem(item);
                }
            break;
            case 'updateFeature':
                if(uid != UID) {
                    var item = JSON.parse(payload);
                    if (self.core.activeherd() == item.feature.properties.store)
                        core.featurestore().updateItem(item);
                }
            break;
            //A peer request information about a herd
            case 'getHerdInfo':
                if(uid != UID) {
                    this.obj._onGetHerdInfo(payload);
                }
            break;
            //Info about a herd comes in...
            case 'herdInfo':
                if(uid != UID) {
                    this.obj._onHerdInfo(payload,uid);
                }
            break;
            
        }
    },
    _onClose: function(event) {
        var code = event.code;
        var self = this;
        var reason = event.reason;
        var wasClean = event.wasClean;
        console.log('disconnected');
        this.close();
        this.obj.core.removeAllPeers();
        this.obj.core.trigger('ws-disconnected');    
        //TODO: doe iets slimmers, hij hangt nu af van de global variable 'core'....
        var restart = function(){
            try{
                core.ws.closews();
            }
            catch(err){
                console.warn(err);
            }
            core.ws.openws();
        }
        setTimeout(restart,5000);
    },
    _onError: function(event, error) {
        //alert(error);
        console.warn('error: ' + event);
    },
    sendData: function(data, action, target){
        //TODO: check if data is an object
        var message = {};        
        message.uid = this.core.UID;
        message.target = target;
        message.action = action;
        message.payload = data;
        if (this.ws && this.ws.readyState == 1){
            this.ws.send(JSON.stringify(message));
        }
    },
    _onConnect: function(payload) {
        var self = this;
        console.log('onConnect');
       
        var name = $('#'+this.core.options.namefield).val();
       
        var options = {};
       
        options.uid = this.core.UID;
        options.cid = payload.cid;        
        options.family = 'alpha'; //used to check if client is able to act as alpha peer
        
        var me = this.core.peers(options);
        
        //let everybody know you exist, before sending peerupdates
        this.sendData(options,'newPeer');// we don't want to trigger anything with this herd
      
        //Immediately give a herdInfo
        var herd = this.core.getHerdByPeerUid(this.core.UID);
        this.sendData(herd.options,'herdInfo');
        
        me.view({"extent":{"bottom":0,"left":0,"top":1,"right":1}});

        me.owner({"name":name});
        me.video({"state":"off"});
        console.log('nr peers: '+this.core.peers().length);
        this.core.trigger('ws-connected');        
        
        //triggers _onNewPeer()
        
        var sendFidList = function(){
            var store = core.featurestore();
            var fids = store.getIdList();
            var message = {};
            message.fids = fids;
            message.storename = self.core.activeherd();
            self.core.websocket().sendData(message, "newPeerFidList");
            
        }
        //TODO TT: at the moment we only check for 1 store to be loaded
        if (this.core.featurestore().loaded == true)
            sendFidList();
        else
            setTimeout(sendFidList, 2000);
            
        
    },
    
    //You just joined and you get from each peer the relevant info
    //Add it to your peerList
    _onInformPeer: function(payload,uid) {        
        console.log('Got peerinfo from: '+uid);        
        if(payload.options.uid !== undefined && payload.options.cid !== undefined) {
            var it = this.core.peers(payload.options);
            it.view({"extent":payload.view});
            it.position({"point":payload.position});
            it.owner(payload.owner);
            if (payload.video)
                it.video(payload.video);
            this.core.trigger('ws-peerInfo');    
        }
        else console.log('badpeer '+uid);
    },
    //A new peer has joined, send it your info, compare its features and add it to your
    //peerList
    _onNewPeer: function(payload,uid) {
        console.log('This peer just connected: '+uid);
        if(payload.uid !== undefined && payload.cid !== undefined) {
            console.log('adding peer');
            var peeroption = 
            this.core.peers(payload);
            var message = {};
            message.options = this.core.me().options;
            message.view = this.core.me().view().extent;
            message.owner = this.core.me().owner();
            message.position = this.core.me().position().point;
            console.log(JSON.stringify(message));
            message.video = this.core.me().video();
            this.sendData(message,'informPeer',uid);
            this.core.trigger('ws-newPeer');
            
            var herd = this.core.getHerdByPeerUid(this.core.me().uid);
            this.sendData(herd.options,'herdInfo');
            
        }
        else console.warn('badpeer '+uid);
    },
    _amIAlpha: function(id,herduid){ //find out wether I am alpha
        if (this.core.activeherd() == herduid){ //I need to be part of the herd
            if (this.core.me().options.cid == id) //yes, I certainly am (the oldest) 
                return true;
            else { //check again if younger peer turns out not to be from alpha family or not part of my herd
                id++; 
                var nextpeer = this.core.getPeerByCid(id);
                if ((nextpeer.options.family && nextpeer.options.family != 'alpha'))
                    this._amIAlpha(id, herduid);    //I might still be alpha
            }
            return false; //Not the oldest in the herd
        }
        else return false; //Not part of herd
    },
    _onNewPeerFidList: function(payload, uid) {
        var self = this; //TODO !! : alpha check must incorporate activeherd!!
        //if (this._amIAlpha(0, payload.storename)){ //Check wether I'm alpha 
            //console.log('I am alpha');
            if (self.core.activeherd() == payload.storename){
                var data = this.core.featurestore().compareIdList(payload.fids);
                var message = {};
                //First the requestlist
                message.requestlist = data.requestlist;
                message.pushlist = []; //empty
                message.storename = payload.storename;
                this.sendData(message,'syncPeer',uid);
                //Now the pushlist bit by bit
                message.requestlist = []; //empty
                var i = 0;
                $.each(data.pushlist, function(id, item){
                        message.pushlist.push(item);
                        i++;
                        if (i >= 1) { //max 1 feat every time
                            i = 0;
                            self.sendData(message,'syncPeer',uid);
                            message.pushlist = []; //empty
                        }
                });
                //sent the remainder of the list
                if (i > 0)
                    this.sendData(message,'syncPeer',uid);
            }
        //}
    },
    
    //The alpha peer sends a sync message including a list with new features and 
    //a request list with features it wants from us
    _onSyncPeer: function(payload,uid) {
        var requested_fids = payload.requestlist;
        var pushed_feats = payload.pushlist;
        if (self.core.activeherd() == payload.storename){
            var store = this.core.featurestore();
            //First sent the features that are asked for
            if (requested_fids.length > 0){
                var message = {};
                message.features = store.requestFeatures(requested_fids);
                message.storename = payload.storename;
                this.sendData(message, 'requestedFeats');
            }
            //Now add the features that have been sent to the featurestore
            if (pushed_feats.length > 0){
                store.putFeatures(pushed_feats);
            }
        }
    },
    //Peer sends back requested features, now store them
    _onRequestedFeats: function(payload,uid) {
        var requested_feats = payload;
        if (self.core.activeherd() == payload.storename){
            var store = this.core.featurestore();
            if (requested_feats.length > 0){
                store.putFeatures(requested_feats);
            }
        }
    },
    //A peer has disconnected, remove it from your peerList and
    //send your new CID to the remaining peers
    _onPeerGone: function(payload) {
        var peerGone = payload.peerCid;    
        var newCid = payload.newCid;        
        this.core.removePeer(peerGone);        
        this.core.me().options.cid = newCid;
        this.core.trigger('ws-peerGone'); //this.core.trigger('peerGinfromone',payload);    
        var message = {};
        message.uid = this.core.me().uid;
        message.connectionID = this.core.me().options.cid;
        this.sendData(message,'updatePeers');
    },
    //Pure websocket function, only needed to keep the connection-ids in sync with the uids
    _onUpdatePeers: function(payload,uid) {
        var peer = this.core.getPeerByUid(uid);
        console.log('updatePeer');
        if(peer !== undefined) {
            var peerCid = payload.connectionID;
            peer.options.cid = peerCid
        }
        else console.warn('badpeer '+uid);
    },
    //A peer has updated, tell the peer object to change
    _onPeerUpdated: function(payload,uid) {
        var peer = this.core.getPeerByUid(uid);
        if(peer !== undefined) {
            peer.events.trigger('ws-updatePeer',payload);
        }
        else console.warn('badpeer '+uid);
    },
    //A peer wants to have more info about a herd. send it
    _onGetHerdInfo: function(payload){
        //Everybody sends data back, if available
        // make sure you're actually aware of the herd, not 'new herd'
        var herdId = payload.herdId;
        var myherds = this.core.herds();
        var self = this;
        $.each(myherds, function(i, herd){
             if (herd.uid == herdId.uid){
                 message = herd;
                 delete message.active;
                 console.log(JSON.stringify(message));
                 self.sendData(message,'herdUpdate');
             }
        })
    },
    _onHerdInfo: function(payload,uid){
        var options = {};
        options.uid = payload.uid;
        options.name = payload.name;
        options.peeruid = uid;
        this.core.herds(options);
    },
    //My stuff has changed, send over the changed data to the other peers
    _onMeChanged: function(evt, payload) {
        var self = evt.data.widget;
        console.log('mechanged '+ JSON.stringify(payload));
        //TODO: check if the payload is good?
        self.sendData(payload,"peerUpdated");
    },
    
    
    bind: function(types, data, fn) {
        var self = this;

        // A map of event/handle pairs, wrap each of them
        if(arguments.length===1) {
            var wrapped = {};
            $.each(types, function(type, fn) {
                wrapped[type] = function() {
                    return fn.apply(self, arguments);
                };
            });
            this.events.bind.apply(this.events, [wrapped]);
        }
        else {
            var args = [types];
            // Only callback given, but no data (types, fn), hence
            // `data` is the function
            if(arguments.length===2) {
                fn = data;
            }
            else {
                if (!$.isFunction(fn)) {
                    throw('bind: you might have a typo in the function name');
                }
                // Callback and data given (types, data, fn), hence include
                // the data in the argument list
                args.push(data);
            }

            args.push(function() {
                return fn.apply(self, arguments);
            });

            this.events.bind.apply(this.events, args);
        }

       
        return this;
    },
    trigger: function() {
        // There is no point in using trigger() insted of triggerHandler(), as
        // we don't fire native events
        this.events.triggerHandler.apply(this.events, arguments);
        return this;
    },
    // Basically a trigger that returns the return value of the last listener
    _triggerReturn: function() {
        return this.events.triggerHandler.apply(this.events, arguments);
    },
    
    
    closews: function() {
        if (this.ws){
            this.ws.close();    
            this.ws = null;
        }
        else
            throw('No websocket active');
    },
    openws: function(url) {
        var core = this.core;
        var ws = new WebSocket(this.url, 'connect');
        ws.onopen=this._onOpen;
        ws.onmessage = this._onMessage;
        ws.onclose = this._onClose;    
        ws.onerror = this._onError;
        ws.obj = this;
        this.ws =ws;
    }
    
};
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
            //the alpha peer sends a sync message with new items and a item request
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
            case 'newItem':
                if(uid != UID) {
                    var item = JSON.parse(payload);
                    if (self.core.activeproject() == item.data.properties.store){
                        core.itemstore().items('feature',{data:item}, 'ws');
                        //core.featurestore().updateItem(item);
                    }
                }
            break;
            /* This can be replace by newItem, they do the same thing */
            case 'updateItem':
                if(uid != UID) {
                    var item = JSON.parse(payload);
                    if (self.core.activeproject() == item.data.properties.store){
                        core.itemstore().items('feature',{data:item},'ws');
                        //core.featurestore().updateItem(item);
                        }
                }
            break;
            /*Not in use, maybe later
            //A peer request information about a project
            case 'getProjectInfo':
                if(uid != UID) {
                    this.obj._onGetProjectInfo(payload);
                }
            break;
            */
            //Info about a project comes in...
            case 'projectInfo':
                if(uid != UID) {
                    this.obj._onProjectInfo(payload,uid);
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
        console.warn('error in websocket connection: ' + event.type);
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
       
        //var name = $('#'+this.core.options.namefield).val();
        var name = self.core.username();
       
        var options = {};
       
        options.uid = this.core.UID;
        options.cid = payload.cid;        
        options.family = 'alpha'; //used to check if client is able to act as alpha peer
        
        var me = this.core.peers(options);
        
        //let everybody know you exist, before sending peerupdates
        this.sendData(options,'newPeer');// we don't want to trigger anything with this project
      
        //Immediately give a projectInfo
        var project = this.core.getProjectByPeerUid(this.core.UID);
        this.sendData(project.options,'projectInfo');
        
        me.view({"extent":{"bottom":0,"left":0,"top":1,"right":1}});

        me.owner({"name":name});
        me.video({"state":"off"});
        console.log('nr peers: '+this.core.peers().length);
        this.core.trigger('ws-connected');        
        
        //triggers _onNewPeer()
        
        var sendFidList = function(){
            var fids = [];
            var items = core.itemstore().items();
            $.each(items, function(i,item){
                var iditem = {};
                iditem._id = item._id;
                iditem.timestamp = item.timestamp();
                iditem.status = item.status();
                fids.push(iditem);    
            });
            //var store = core.itemstore();
            //var fids = store.getIdList();
            var message = {};
            message.fids = fids;
            message.storename = self.core.activeproject();
            self.core.websocket().sendData(message, "newPeerFidList");
            
        }
        //SMO TODO: turn this into a proper callback
        setTimeout(sendFidList, 2000);
            
        
    },
    
    //You just joined and you get from each peer the relevant info
    //Add it to your peerList
    _onInformPeer: function(payload,uid) {        
        console.log('Got peerinfo from: '+uid);        
        if(payload.options.uid !== undefined && payload.options.cid !== undefined) {
            var it = this.core.peers(payload.options);
            it.owner(payload.owner);
            it.view({"extent":payload.view});
            it.position({"point":payload.position});
            if (payload.video)
                it.video(payload.video);
            this.core.trigger('ws-peerInfo');    
        }
        else console.log('badpeer '+uid);
    },
    
    //A new peer has joined, send it your info, compare its items and add it to your
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
            
            var project = this.core.getProjectByPeerUid(this.core.me().uid);
            this.sendData(project.options,'projectInfo');
            
        }
        else console.warn('badpeer '+uid);
    },
    _amIAlpha: function(id,projectuid){ //find out wether I am alpha
        if (this.core.activeproject() == projectuid){ //I need to be part of the project
            if (this.core.me().options.cid == id) //yes, I certainly am (the oldest) 
                return true;
            else { //check again if younger peer turns out not to be from alpha family or not part of my project
                id++; 
                var nextpeer = this.core.getPeerByCid(id);
                if ((nextpeer.options.family && nextpeer.options.family != 'alpha'))
                    this._amIAlpha(id, projectuid);    //I might still be alpha
            }
            return false; //Not the oldest in the project
        }
        else return false; //Not part of project
    },
    _onNewPeerFidList: function(payload, uid) {
        var self = this; //TODO !! : alpha check must incorporate activeproject!!
        //if (this._amIAlpha(0, payload.storename)){ //Check wether I'm alpha 
            //console.log('I am alpha');
            if (self.core.activeproject() == payload.storename){
                this.core.itemstore().syncFids(payload,uid);
            }
        //}
    },
    
    //The alpha peer sends a sync message including a list with new items and 
    //a request list with items it wants from us
    _onSyncPeer: function(payload,uid) {
        var requested_fids = payload.requestlist;
        var pushed_feats = payload.pushlist;
        if (self.core.activeproject() == payload.storename){
            var store = this.core.itemstore();
            //First sent the items that are asked for
            if (requested_fids.length > 0){
                var message = {};
                message.items = store.requestItems(requested_fids);
                message.storename = payload.storename;
                this.sendData(message, 'requestedFeats');
            }
            //Now add the items that have been sent to the itemstore
            if (pushed_feats.length > 0){
                $.each(pushed_feats, function(i,feat){
                        store.items('feature',{data: feat},'ws');
                });
                //store.putFeatures(pushed_feats);
            }
        }
    },
    //Peer sends back requested items, now store them
    _onRequestedFeats: function(payload,uid) {
        var requested_feats = payload.items;
        if (self.core.activeproject() == payload.storename){
            var store = this.core.itemstore();
            if (requested_feats.length > 0){
                $.each(requested_feats, function(i,feat){
                        store.items('feature',{data: feat},'ws');
                });
                //store.putFeatures(requested_feats);
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
        this.core.trigger('ws-peerGone',payload); //this.core.trigger('peerGinfromone',payload);    
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
    /*Not in use. Maybe in future
    //A peer wants to have more info about a project. send it
    _onGetProjectInfo: function(payload){
        //Everybody sends data back, if available
        // make sure you're actually aware of the project, not 'new project'
        var projectId = payload.projectId;
        var myprojects = this.core.projects();
        var self = this;
        $.each(myprojects, function(i, project){
             if (project.uid == projectId.uid){
                 message = project;
                 delete message.active;
                 console.log(JSON.stringify(message));
                 self.sendData(message,'projectUpdate');
             }
        })
    },
    */
    _onProjectInfo: function(payload,uid){
        var options = {};
        if (payload.uid) options._id = payload.uid //COUCHDB temporary solution
        else options._id = payload._id;
        options.name = payload.name;
        options.peeruid = uid; //Add this peer to the project members
        var project = this.core.projects(options);
        if (payload.groups){//Add group info to project
            $.each(payload.groups, function(i,d){
                    var group = project.groups({_id:d._id, name: d.name});
                    group.members(d.members);
                    group.groups(d.groups);
            });
        }
        this.core.trigger('projectListChanged');
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
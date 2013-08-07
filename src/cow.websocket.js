$.Cow.Websocket.prototype = {
	
	_onOpen: function() {
		
		console.log('connected');
	},
	_onMessage: function(message) {
		var core = this.obj.core;
		//console.debug('message: '+message.data);
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
					this.obj.__onUpdatePeer(payload,uid);
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
			//a peer has moved its map, recieve a new extent
			case 'peerMoved':
				if(uid != UID) {
					this.obj._onPeerMoved(payload,uid);
				}
			break;
			//a peer has changed its location
			case 'peerLocationChanged':
				if(uid != UID) {
					this.obj._onPeerChangedLocation(payload,uid);
				}
			break;
			//a peer has changed its params (name, herd)
			case 'peerParamsChanged':
				if(uid != UID) {
					this.obj._onPeerChangedParams(payload,uid);
				}
			break;
			
			//a new object was drawn or updated by a peer
			case 'newFeature':
				if(uid != UID) {
					var item = JSON.parse(payload);
					if (self.core.options.activeHerd == item.feature.properties.store)
					    core.featurestore().updateItem(item);
				}
			break;
			case 'updateFeature':
				if(uid != UID) {
					var item = JSON.parse(payload);
					if (self.core.options.activeHerd == item.feature.properties.store)
					    core.featurestore().updateItem(item);
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
		this.obj.core.trigger('disconnected');	
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
		//TODO TT: Extent should not be taken from map object directly but from mapwidget
		//var extent = this.core.map.getExtent();
		var extent = {left: 0, bottom: 0, top: 1, right: 1};
		var name = $('#'+this.core.options.namefield).val();
		
		var options = {};
		options.extent = JSON.parse(JSON.stringify(extent));
		options.uid = this.core.UID;
		options.cid = payload.cid;		
		options.owner = name;
		options.herd = self.core.options.activeHerd;
		options.family = 'alpha'; //used to check if client is able to act as alpha peer
		var me = this.core.peers(options);
		console.log('nr peers: '+this.core.peers().length);
		this.core.trigger('connected');		
		this.sendData(options,'newPeer');
		
		var sendFidList = function(){
			var store = core.featurestore();
            var fids = store.getIdList();
            var message = {};
            message.fids = fids;
            message.storename = self.core.options.activeHerd;
            self.core.websocket().sendData(message, "newPeerFidList");
			
		}
		//TODO TT: at the moment we only check for 1 store to be loaded
		if (this.core.featurestore().loaded == true)
			sendFidList();
		else
			setTimeout(sendFidList, 2000);
			
		
	},
	
	_onDBLoaded: function(){
	    
	},
	//You just joined and you get from each peer the relevant info
	//Add it to your peerList
	_onInformPeer: function(payload,uid) {		
		console.log('Got peerinfo from: '+uid);		
		if(payload.uid !== undefined && payload.extent !== undefined && payload.cid !== undefined) {
			this.core.peers(payload);
			this.core.trigger('peerInfo');	
		}
		else console.log('badpeer');
	},
	//A new peer has joined, send it your info, compare its features and add it to your
	//peerList
	_onNewPeer: function(payload,uid) {
		console.log('This peer just connected: '+uid);
		if(payload.uid !== undefined && payload.extent !== undefined && payload.cid !== undefined) {
			this.core.peers(payload);
			var message = this.core.me().options;
			this.sendData(message,'informPeer',uid);
			this.core.trigger('newPeer');
		}
		else console.warn('badpeer');
	},
	_amIAlpha: function(id,herd){ //find out wether I am alpha
	    if (this.core.me().options.herd == herd){ //I need to be part of the herd
            if (this.core.me().options.cid == id) //yes, I certainly am (the oldest) 
                return true;
            else { //check again if younger peer turns out not to be from alpha family or not part of my herd
                id++; 
                var nextpeer = this.core.getPeerByCid(id);
                if ((nextpeer.options.family && nextpeer.options.family != 'alpha') ||
                    (nextpeer.options.herd && nextpeer.options.herd != this.core.me().options.herd))
                    this._amIAlpha(id, herd);	//I might still be alpha
            }
            return false; //Not the oldest in the herd
        }
        else return false; //Not part of herd
	},
	_onNewPeerFidList: function(payload, uid) {
		var self = this; //TODO !! : alpha check must incorporate activeherd!!
		//if (this._amIAlpha(0, payload.storename)){ //Check wether I'm alpha 
			//console.log('I am alpha');
			if (self.core.options.activeHerd == payload.storename){
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
		if (self.core.options.activeHerd == payload.storename){
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
		if (self.core.me().options.herd == payload.storename){
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
		//this.core.trigger('peerGinfromone',payload);	
		var message = {};
		message.uid = this.core.me().uid;
		message.connectionID = this.core.me().options.cid;
		this.sendData(message,'updatePeers');
	},
	//Pure websocket function, only needed to keep the connection-ids in sync with the uids
	__onUpdatePeer: function(payload,uid) {
		var peer = this.core.getPeerByUid(uid);
		console.log('updatePeer');
		if(peer !== undefined) {
			var peerCid = payload.connectionID;
			peer.options.cid = peerCid
		}
		else console.warn('badpeer');
	},
	_onPeerMoved: function(payload,uid) {
		var peer = this.core.getPeerByUid(uid);
		if(peer !== undefined) {
			peer.events.trigger('peerMoved',payload);
			//console.log('peerMoved');
		}
		else console.warn('badpeer');
	},
	//a peer has changed location, redraw its position on the map
	_onPeerChangedLocation: function(payload, uid){
		var peer = this.core.getPeerByUid(uid);
		
		if(peer !== undefined) {
			peer.events.trigger('locationChange',payload);
			//console.log('locationChange');
		}
		else console.warn('badpeer');
	},
	//a peer has changed its parameters, reset its peer options
	_onPeerChangedParams: function(payload, uid){
		var peer = this.core.getPeerByUid(uid);
		
		if(peer !== undefined) {
			peer.events.trigger('paramChange',payload);
			//console.log('locationChange');
		}
		else console.warn('badpeer');
	},
	_onMapMoved: function(evt,extent) {
		var self = evt.data.widget;
		//if you initialise the map it gives a mapmove event, but core.me() is not yet finished
		if(self.core.me() !== undefined) {		
			self.core.me().extent(extent);
			var message = {};
			message.extent = self.core.me().extent();
			message.owner = self.core.me().options.owner;
			self.sendData(message,'peerMoved');
		}
	},
	//my location has changed, send update to world
	_onLocationChanged: function(evt, payload) {
		var self = evt.data.widget;
		var position = payload.position;
		var message = {};
		message.position = position;
		message.uid = self.core.UID;
		self.sendData(message,'peerLocationChanged');
	},
	//my params changed, send update to world
	_onParamsChanged: function(evt, payload) {
		var self = evt.data.widget;
		var name = payload.name;
		var herd = payload.herd;
		var message = {};
		message.name = name;
		message.herd = herd;
		message.uid = self.core.UID;
		self.sendData(message,'peerParamsChanged');
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
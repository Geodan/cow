$.Cow.Websocket.prototype = {
	
	_onOpen: function() {
		
		console.log('connected');
	},
	_onMessage: function(message) {
		var core = this.obj.core;
		console.log('message: '+message.data);
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
			
			//a new object was drawn or updated by a peer
			case 'newFeature':
				if(uid != UID) {
					var item = JSON.parse(payload);
					core.getFeaturestoreByName("store1").updateItem(item);
				}
			break;
			case 'updateFeature':
				if(uid != UID) {
					var item = JSON.parse(payload);
					core.getFeaturestoreByName("store1").updateItem(item);
				}
			break;
		}
	},
	_onClose: function(event) {
		var code = event.code;
		var reason = event.reason;
		var wasClean = event.wasClean;
		console.log('disconnected');
		this.close();
		this.obj.core.trigger('disconnected');	
		//TODO: doe iets slimmers, hij hangt nu af van de global variable 'core'....
		setTimeout("core.ws.openws('wss://websocket.geodan.nl:443/')",10000);
		//setTimeout(restart,10000);
	},
	_onError: function(event, error) {
		alert(error);
		console.log('error');
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
		var extent = this.core.map.getExtent();
		var name = $('#'+this.core.options.namefield).val();
		
		var options = {};
		options.extent = JSON.parse(JSON.stringify(extent));
		options.uid = this.core.UID;
		options.cid = payload.cid;		
		options.owner = name;
		var me = this.core.peers(options);
		console.log('nr peers: '+this.core.peers().length);
		this.core.trigger('connected');		
		this.sendData(options,'newPeer');
		//TODO TT: hier moet nog een mooie oplossing voor komen
		var sendFidList = function(){
			var store=self.core.getFeaturestoreByName("store1")
			var fids = store.getIdList();
			var message = fids;
			self.core.websocket().sendData(message, "newPeerFidList");
		}
		if (this.core.getFeaturestoreByName("store1").loaded == true)
			sendFidList();
		else
			setTimeout(sendFidList, 2000);
			
		
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
		else console.log('badpeer');
	},
	_onNewPeerFidList: function(payload, uid) {
		if (this.core.me().options.cid == 0){ //Check wether I'm alpha
				var message = this.core.getFeaturestoreByName("store1").compareIdList(payload); 
				this.sendData(message,'syncPeer',uid);
			}
	},
	
	//The alpha peer sends a sync message including a list with new features and 
	//a request list with features it wants from us
	_onSyncPeer: function(payload,uid) {
		var requested_fids = payload.requestlist;
		var pushed_feats = payload.pushlist;
		var store = this.core.getFeaturestoreByName("store1");
		//First sent the features that are asked for
		if (requested_fids.length > 0){
			var message = store.requestFeatures(requested_fids);
			this.sendData(message, 'requestedFeats');
		}
		//Now add the features that have been sent to the featurestore
		if (pushed_feats.length > 0){
			store.putFeatures(pushed_feats);
		}
	},
	//Peer sends back requested features, now store them
	_onRequestedFeats: function(payload,uid) {
		var requested_feats = payload;
		var store = this.core.getFeaturestoreByName("store1");
		if (requested_feats.length > 0){
			store.putFeatures(requested_feats);
		}
	},
	//A peer has disconnected, remove it from your peerList and
	//send your new CID to the remaining peers
	_onPeerGone: function(payload) {
		var peerGone = payload.peerCid;	
		var newCid = payload.newCid;		
		this.core.removePeer(peerGone);		
		this.core.me().options.cid = newCid;
		this.core.trigger('peerGone',payload);	
		var message = {};
		message.uid = this.core.me().uid;
		message.connectionID = this.core.me().options.cid;
		this.sendData(message,'updatePeers');
	},
	//Pure websocket function, only needed to keep the connection-ids in sync with the uids
	__onUpdatePeer: function(payload,uid) {
		var peer = this.core.getPeerByUid(uid);	
		if(peer !== undefined) {
			var peerCid = payload.connectionID;
			peer.options.cid = peerCid
		}
		else console.log('badpeer');
	},
	_onPeerMoved: function(payload,uid) {
		var peer = this.core.getPeerByUid(uid);
		if(peer !== undefined) {
			peer.events.trigger('peerMoved',payload);
			console.log('peerMoved');
		}
		else console.log('badpeer');
	},
	//a peer has changed location, redraw its position on the map
	_onPeerChangedLocation: function(payload, uid){
		var peer = this.core.getPeerByUid(uid);
		if(peer !== undefined) {
			peer.events.trigger('locationChange',payload);
			console.log('locationChange');
		}
		else console.log('badpeer');
	},
	_onMapMoved: function(evt) {
		var self = evt.data.widget;
		//if you initialise the map it gives a mapmove event, but core.me() is not yet finished
		if(self.core.me() !== undefined) {		
			self.core.me().extent(self.core.map.getExtent());
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
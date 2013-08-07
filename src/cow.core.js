(function ($) {

$.Cow = $.Cow || {};

/**
#Cow.Core

The Cow.Core object. It is automatically constructed from the options
given in the `cow([options])` constructor. 
 */
$.Cow.Core = function(element, options) {
    var self = this;
    var time = new Date();
    this.UID = time.getTime(); 
    /* SMO: obsolete 7/8/2013
    this.MYLOCATION = "My location";
    this.LOCATION_ICON = './mapicons/male.png';
    this.MYLOCATION_ICON = './mapicons/you-are-here-2.png';
    this.current_icon;
    */
    this.options = $.extend({}, new $.fn.cow.defaults.core(), options);
    this.element = element;
    this.map = window[this.options.map];
    this.ws ={};
    this.peerList = [];
    /* SMO: obsolete 7/8/2013
    this.herdList = [{id:0,name:"sketch"},{id:1,name:"test"}]; //Altijd initiele sketch herd aanwezig
    */
    this.herdList = [{id:0,name:"sketch"}];
    this.options.activeHerd = this.herdList[0].id;
    this.localDbase;
    this.geoLocator;
    this.featureStore;
    this.events = $({});
    if(this.options.websocket!==undefined) {
        this.websocket(this.options.websocket);
    }
    if(this.options.featurestore!==undefined) {
        this.featurestore(this.options.featurestore);
    }
    if(this.options.localdbase!==undefined) {
        this.localdbase(this.options.localdbase);
    }
    if(this.options.geolocator!==undefined) {
        this.geolocator(this.options.geolocator);
    }
    element.data('cow', this);
    self.bind("disconnected", {widget: self}, self.removeAllPeers);
    
    //TODO: put this in a proper function
    self.bind('changeHerdRequest', {widget:self}, function(e,id){
            self.featurestore().clear(); //Clear featurestore
            self.me().options.herd = id;
            self.options.activeHerd = id;
            self.options.storename = "store_"+id; //TODO: the link between activeHerd and storename can be better
            self.localdbase().loadFromDB();//Fill featurestore with what we have
            var options = {name: self.me().options.owner, herd: self.me().options.herd};
            self.trigger("paramsChange",options);
    });
    
    
    
};
/**
#Cow.Websocket

The Cow.Websocket object. It is constructed with ws options object in the
cow.`websocket([options])` function or by passing a `websocket:{options}` object in
the `cow()` constructor. 

example: websocket: {url: 'wss://80.113.1.130:443/'}
 */
$.Cow.Websocket = function(core, options) {
    var self = this;
    this.core = core;
    this.options = options;
    this.events = $({});
    //TODO: if connection cannot be established inform the user
    if (!this.ws || this.ws.readyState != 1) //if no connection
    {
        if(this.options.url && this.options.url.indexOf('ws') ==0) {
            this.url = this.options.url;
            this.openws(this.url)
        }
    }
    this.core.bind('moveend', {widget: self}, self._onMapMoved);
    this.core.bind('mylocationChange', {widget:self}, self._onLocationChanged);
    this.core.bind('paramChange', {widget:self}, self._onParamsChanged);
    
    //SMO: waarom?
    //return this;
    this.handlers = {
        // Triggers the jQuery events, after the OpenLayers events
        // happened without any further processing
        simple: function(data) {
            this.trigger(data.type);
        }
    };
    
};

    /* SMO: obsolete 7/8/2013
    */
//TODO TT: Is this the best place to initialize an item? 
$.Cow.Item = function(core, options){
    var self = this;
    this.core = core;
    this.options = options;
};


/**
#Cow.Herd

The Cow.Herd object. It is constructed from within cow, it contains information
on a available herd. The core.herdList contains 
a list of Cow.Herd objects, including the special 'sketch' herd

 */
$.Cow.Peer = function(core, options) {
    var self = this;
    this.core = core;
    this.options = options;
};

/**
#Cow.Peer

The Cow.Peer object. It is constructed from within cow, it contains information
on a connected peer. The core.peerList contains 
a list of Cow.Peer objects, including the special 'me' peer

 */
$.Cow.Peer = function(core, options) {
    var self = this;
    this.core = core;
    this.options = options;
    this.uid = options.uid;
    this.bbox;
    this.params = {};
    this.viewfeature;
    this.events = $({});
    
    this.events.bind('updatePeer', {widget: self}, self._onUpdatePeer);
    /* SMO: obsolete 7/8/2013
    //Someone moved
    this.events.bind('peerMoved', {widget:self}, self._onMoved);
    
    this.events.bind('updatePeer', {widget:self}, self._onMoved);
    
    //my physical position changed
    this.events.bind('mylocationChange', {widget:self}, self._onLocationChanged);
    //someone's physical position changed
    this.events.bind('locationChange', {widget:self}, self._onLocationChanged);
    //someone changed other metadata
    this.events.bind('paramChange', {widget:self}, self._onParamsChanged);
    
    this.uid;
    this.cid;
    this.name;
    this.extent;*/
    
    if(this.options.extent!==undefined) {
        this.extent(this.options.extent);
    };
    
    
    this.handlers = {
        // Triggers the jQuery events, after the OpenLayers events
        // happened without any further processing
        simple: function(data) {
            this.trigger(data.type);
        },
        includeFeature: function(data) {
            var feature = data.feature;
            this.trigger(data.type, [feature]);
        }
    };
};
/***
$.Cow.LocalDbase object
Accessed from the core the localbase.
On creation it also populates the featurestore.
***/
$.Cow.LocalDbase = function(core, options) {
    var self = this;
    this.loaded = false;
    this.core = core;
    this.options = options;
    this.options.dbname = "cow";
    var iteration = self.loadFromDB();
}
/***
$.Cow.FeatureStore
***/
$.Cow.FeatureStore = function(core, options) {
    var self = this;
    this.loaded = false;
    this.core = core;
    this.options = options;
    this.events = $({});
    this.uid = this.core.UID;
    this.itemList = [];
    //this.name = this.options.name || "store1";
    
    this.core.bind('sketchcomplete', {widget: self}, self._onSketchComplete);
    this.core.bind('afterfeaturemodified', {widget: self}, self._onFeatureModified);
}

/***
$.Cow.GeoLocator
***/
$.Cow.GeoLocator = function(core, options){
    var self = this;
    this.core = core;
    this.options = options;
    this.events = $({});
    this.uid = this.core.UID;
    //We need a timeout to settle the core
    setTimeout(function(){self.getLocation()},2000);
}

$.Cow.Core.prototype = {
    /**
    ##cow.me()
    ###**Description**: returns the peer object representing the client it self
    */    
    me: function(){
        var peer = this.getPeerByUid(this.UID);    
        return peer;
    },
    
/**
##cow.websocket([options])
###**Description**: get/set the websocket of the cow
*/
    websocket: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getWebsocket();
        case 1:
            if (!$.isArray(options)) {
                return this._setWebsocket(options);
            }
            else {
                throw('wrong argument number, only one websocket allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    
    _getWebsocket: function() {
        return this.ws;
    },
    _setWebsocket: function(options) {
        var websocket = new $.Cow.Websocket(this, options);
        this.ws=websocket;
    },

/**
##cow.herds([options])
###**Description**: get/set the herds of the cow

**options** an object of key-value pairs with options to create one or
more herds

>Returns: [herd] (array of Cow.herd) _or_ false

The `.herds()` method allows us to attach herds to a cow object. It takes
an options object with herd options. To add multiple herds, create an array of
herds options objects. If an options object is given, it will return the
resulting herd(s). We can also use it to retrieve all herds currently attached
to the cow.

When adding herds, those are returned. 

*/

    herds: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getHerds();
        case 1:
            if (!$.isArray(options)) {
                return this._addHerd(options);
            }
            else {
                return $.core(options, function(peer) {
                    return self._addHerd(herd);
                })
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getHerds: function() {
        var herds = [];
        $.each(this.herdList, function(id, herd) {
            herds.push(herd);
        });        
        return herds;
    },
    _addHerd: function(options) {
        var herd = new $.Cow.Herd(this, options);        
        
        if (options.uid != this.UID){
            
        }
        this.herdList.push(herd);
        //TODO: enable peer.trigger
        //peer.trigger('addpeer');
        return herd;
    },
    getHerdById: function(id) {
        var herds = this.herds();
        var herd;
        $.each(herds, function(){
            if(this.id == id) {            
                herd = this;
            }            
        });
        return herd;
    },
    removeHerd: function(id) {
        var herds = this.herds();
        var herdGone = id;
        var delPeer;
        $.each(herds, function(i){
            if(this.id == peerGone) {            
                delHerd = i;
            }            
        });
        if(delHerd >= 0) herds.splice(delHerd,1);
        this.herdList = herds;        
    },


/**
##cow.peers([options])
###**Description**: get/set the peers of the cow

**options** an object of key-value pairs with options to create one or
more peers

>Returns: [peer] (array of Cow.Peer) _or_ false

The `.peers()` method allows us to attach peers to a cow object. It takes
an options object with peer options. To add multiple peers, create an array of
peers options objects. If an options object is given, it will return the
resulting peer(s). We can also use it to retrieve all peers currently attached
to the cow.

When adding peers, those are returned. 

*/
    peers: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getPeers();
        case 1:
            if (!$.isArray(options)) {
                return this._addPeer(options);
            }
            else {
                return $.core(options, function(peer) {
                    return self._addPeer(peer);
                })
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getPeers: function() {
        var peers = [];
        $.each(this.peerList, function(id, peer) {
            //SMO: mogelijk nog iets leuks meet peer volgorde ofzo
            peers.push(peer);
        });        
        return peers;
    },
    _addPeer: function(options) {
        var peer = new $.Cow.Peer(this, options);        
        
        if (options.uid != this.UID){
            
            var geojson_format = new OpenLayers.Format.GeoJSON();
            var feature = geojson_format.read(peer.view());
            peer.params.feature = feature;
            peer.extent(options.extent);
            if (options.position){
                peer.drawPosition(options.position);
            }
        }
        this.peerList.push(peer);
        //TODO: enable peer.trigger
        //peer.trigger('addpeer');
        return peer;
    },
    //Return feature collection of peer view extents
    getPeerExtents: function() {
        var collection = {"type":"FeatureCollection","features":[]};
        $.each(core.peers(), function(){
            if (this.params.viewfeature.id != self.core.me().uid)
            collection.features.push(this.params.viewfeature);
        });
        return collection;
    },
    //Return feature collection of peer positions
    getPeerPositions: function(){
        var collection = {"type":"FeatureCollection","features":[]};
        $.each(core.peers(), function(){
            if (this.params.pointfeature)
                collection.features.push(this.params.pointfeature);
        });
        return collection;
    },
    getPeerByUid: function(uid) {
    
        var meuid = uid;
        var peers = this.peers();
        var peer;
        $.each(peers, function(){
            if(this.uid == meuid) {            
                peer = this;
            }            
        });
        
        return peer;
    },
    getPeerByCid: function(cid) {
    
        var mecid = cid;
        var peers = this.peers();
        var peer;
        $.each(peers, function(){
            if(this.options.cid == mecid) {            
                peer = this;
            }            
        });
        
        return peer;
    },
/**
##cow.removePeer(cid)
###**Description**: removes the specific peer from the list of peers
*/
    removePeer: function(cid) {
        //TODO: dit werkt niet, toch doro de hele cid lijst lopen
        var peers = this.peers();
        var peerGone = cid;
        var delPeer;
        var feature;
        var point;
        var geolocation;
        var uid;
        $.each(peers, function(i){
            if(this.options.cid == peerGone) {            
                delPeer = i;
                uid = this.uid;
                if(this.params !== undefined) {
                    feature = this.params.feature[0];
                    point = this.params.point[0];
                }
            }            
        });
        /* Obs by d3 layer
        geolocation = self.core.mylocationLayer.getFeaturesByAttribute('uid', uid);        
        this.mylocationLayer.removeFeatures(geolocation);
        */
        if(delPeer >= 0) peers.splice(delPeer,1);
        this.peerList = peers;        
        //TODO: remove peer from d3 layers
        
    },
    removeAllPeers: function() {
        var peers = this.peers();
        $.each(peers, function(i,peer){
            peer = {};
        });
        this.peerList = [];
        //TODO: remove peer from d3 layers
    },
        
    /***
    LOCAL DATABASE
    ***/
    localdbase: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getLocalDbase();
        case 1:
            if (!$.isArray(options)) {
                return this._setLocalDbase(options);
            }
            else {
                throw('only one dbase allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getLocalDbase: function(){
        return this.localDbase;
    },
    _setLocalDbase: function(options){
        var dbase = new $.Cow.LocalDbase(this, options);
        this.localDbase = dbase;
    },
     /***
    GEO LOCATOR
    ***/
    geolocator: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getGeoLocator();
        case 1:
            if (!$.isArray(options)) {
                return this._setGeoLocator(options);
            }
            else {
                throw('only one geolocator allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getGeoLocator: function(){
        return this.geoLocator;
    },
    _setGeoLocator: function(options){
        var locator = new $.Cow.GeoLocator(this, options);
        this.geoLocator = locator;
    },
    /***
    FEATURE STORES
    ***/
    featurestore: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getFeaturestore();
        case 1:
            if (!$.isArray(options)) {
                return this._addFeaturestore(options);
            }
            else {
                throw('only one featstore allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getFeaturestore: function(){
        return this.featureStore;
    },
    _addFeaturestore: function(options){
        var featureStore = new $.Cow.FeatureStore(this, options);        
        this.featureStore = featureStore;
        return featureStore;
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

    destroy: function() {
        this.map.destroy();
        this.element.removeData('cow');
    }
   
};

$.fn.cow = function(options) {
    return this.each(function() {
        var instance = $.data(this, 'cow');
        if (!instance) {
            $.data(this, 'cow', new $.Cow.Core($(this), options));
        }
    });
};

$.fn.cow.defaults = {
    core: function() {
        return {
            map: 'map',
            editlayer: 'editlayer',
            namefield: 'myname'
        };
    }
};

$.Cow.util = {};
// http://blog.stevenlevithan.com/archives/parseuri (2010-12-18)
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
// Edited to include the colon in the protocol, just like it is
// with window.location.protocol
$.Cow.util.parseUri = function (str) {
    var o = $.Cow.util.parseUri.options,
        m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i = 14;

    while (i--) {uri[o.key[i]] = m[i] || "";}

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) {uri[o.q.name][$1] = $2;}
    });

    return uri;
};
$.Cow.util.parseUri.options = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user",
            "password", "host", "port", "relative", "path", "directory",
            "file", "query", "anchor"],
    q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+:))?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+:))?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
};
// Checks whether a URL conforms to the same origin policy or not
$.Cow.util.sameOrigin = function(url) {
    var parsed = $.Cow.util.parseUri(url);
    parsed.protocol = parsed.protocol || 'file:';
    parsed.port = parsed.port || "80";

    var current = {
        domain: document.domain,
        port: window.location.port,
        protocol: window.location.protocol
    };
    current.port = current.port || "80";

    return parsed.protocol===current.protocol &&
        parsed.port===current.port &&
        // the current domain is a suffix of the parsed domain
        parsed.host.match(current.domain + '$')!==null;
};
})(jQuery);
$.Cow.Peer.prototype = {
    
    /*
    view is an object containing:
    -feature: a full GeoJSON feature representing the view-extent
    -extent: an object {left, bottom, right, top} meant for syncing
    
    view() takes an options object {feature:<GeoJSON feature>,extent: {bottom:#,left:#,top:#,right:#}}
    */    
    view: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getView();
        case 1:
            if (!$.isArray(options)) {                
                return this._setView(options);
            }
            else {
                throw('wrong argument number, only one view-extent allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    //internal, use .view()
    _getView: function() {
        var _view = {};
        _view.feature = this.params.viewFeature;
        _view.extent = this.params.viewExtent;
        return _view;
    },
    //internal, use .view(options)
    _setView: function(options) {    
        if(options.feature !== undefined) {
            this.params.viewFeature = options.feature
            this.params.viewExtent = this._view2bbox(options.feature);
        }
        else if(options.extent !== undefined) {
        console.log('extent');
            this.params.viewExtent = options.extent
            this.params.viewFeature = this._bbox2view(options.extent);
        }
        if(this.uid == this.core.UID) {
            this.core.trigger("peerStoreChanged", this.uid);
            this.core.trigger("meChanged", {"extent":this.view().extent});
        }
    },
    //helper function to turn a view feature to an extent object
    _view2bbox: function(view) {
        var coords = view.geometry.coordinates;
        var bounds = {};
        bounds.bottom = coords[0][1];
        bounds.left = coords[0][0];
        bounds.top = coords[2][1];
        bounds.right = coords[2][0];
        return bounds;
    },
    //helper function to turn an extent object to a view feature 
    _bbox2view: function(bbox) {
        var b = [bbox.left,bbox.bottom,bbox.right,bbox.top];
        var feature = { "id": this.uid,
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [ [b[0], b[1]],[b[0],b[3]],[b[2],b[3]],[b[2],b[1]],[b[0],b[1]]
                                ]
                            ]
                        },
                     "properties": {
                        "uid":this.uid,
                        "owner": this.options.owner,
                        "label":""
                    }
                }
        return feature;
    },
    
    /*
    position is an object containing:
    -feature: a full GeoJSON point feature
    -point: an object containing latitude, longitude and time
    
    position() takes an options object: {feature:<GeoJSON feature>,point: {longitude:#,latitude:#,time:timestamp}}
    */
    position: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getPosition();
        case 1:
            if (!$.isArray(options)) {                
                return this._setPosition(options);
            }
            else {
                throw('wrong argument number, only one position allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getPosition: function() {
        var _position = {};
        _position.feature = this.params.locationFeature;
        _position.point = this.params.locationPoint;
        return _position;
    },
    _setPosition: function(options){
        if(options.feature !== undefined) {
            this.params.locationFeature = options.feature
            this.params.locationPoint = this._position2point(options.feature);
        }
        else if(options.point !== undefined) {
            this.params.locationPoint = options.point;
            this.params.locationFeature = this._point2position(options.point);
        }
        
        if(this.uid == this.core.UID) {
            this.core.trigger("peerStoreChanged", this.uid);
            this.core.trigger("meChanged", {"point":this.params.locationPoint});
        }
    },
    _position2point: function(pos) {
        var _point = {};
        _point.longitude = pos.geometry.coordinates[0];
        _point.latitude =  pos.geometry.coordinates[1];
        _point.time = pos.properties.time;
        return _point;
    },
    _point2position: function(point) {
        var attributes = { uid: this.uid, owner: this.options.owner};
        if(point.time) {
            attributes.time = point.time;
        }
        else {
            if(!this.params.locationFeature) {
                console.warn('Recieved a position without time, defaulting to current time');
                var time = new Date();
                attributes.time = time.getTime();
            }
        }
        var _position = { 
            "id": this.uid,
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ point.longitude,point.latitude
                ]
            },
            "properties": attributes
        };
        return _position;
    },
    
    /*
    herd is an object containing:
    -name: the name of the herd
    -uid: unique ID of the herd, must be unique for ever
    
    herd() takes an options object: {name:"herd name",uid:#}
    */
    herd: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getHerd();
        case 1:
            if (!$.isArray(options)) {                
                return this._setHerd(options);
            }
            else {
                throw('wrong argument number, only one herd per peer allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getHerd: function() {
        return this.params.herd;
    },
    _setHerd: function(options){
        if(options.uid === undefined) {
            throw "Herd without ID!";
        }
        if(!options.name) {
                options.name = "herd-"+options.uid;
        }
        this.params.herd = options;
        if(this.uid == this.core.UID) {
            this.core.trigger("peerStoreChanged", this.uid);
            this.core.trigger("meChanged", {"herd":this.params.herd});
        }
    },
    
    /*
    owner is an object containing:
    -name: the name of the owner
    
    owner() takes an options object: {name:"owner name"}
    */
    owner: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getOwner();
        case 1:
            if (!$.isArray(options)) {                
                return this._setOwner(options);
            }
            else {
                throw('wrong argument number, only one owner per peer allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getOwner: function() {
        return this.params.owner;
    },
    _setOwner: function(options){
        this.params.owner = options.owner;
        if(this.params.owner === undefined) this.params.owner = 'anonymous';
        if(this.uid == this.core.UID) {
            this.core.trigger("peerStoreChanged", this.uid);
            this.core.trigger("meChanged", {"owner":this.params.owner});
        }
    },
    
    
    //this one gets triggered by the websocket
    _onUpdatePeer: function(evt, payload) {
        var self = evt.data.widget;
        if(payload.owner) {
            self.owner(payload.owner);
        }
        if(payload.herd) {
            self.herd(payload.herd);
        }
        if (payload.extent) {
            self.view({extent: payload.extent});
        }
        if(payload.position) {
            self.position(payload.position);
        }
        
        self.core.trigger("peerStoreChanged", this.uid);
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
    }
    
};



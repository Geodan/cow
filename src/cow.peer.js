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
            this.params.viewExtent = options.extent
            this.params.viewFeature = this._bbox2view(options.extent);
        }
        self.core.trigger("peerExtentChanged", core.getPeerExtents());
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
    -point: an object containing latitude and longitude
    
    position() takes an options object: {coords:{longitude:#,latitude:#},time:timestamp}
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
        var attributes = { uid: this.uid, owner: this.options.owner};
        if(options.time) {
            attributes.time = options.time;
        }
        else {
            
        }
        var _point = { 
            "id": this.uid,
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                ]
            },
            "properties": attributes
        };
        if(options.coords){
            if(!this.params.locationFeature) {
                _point.geometry.coordinates[0] = options.coords.longitude;
                _point.geometry.coordinates[1] = options.coords.latitude;
                _point.properties = attributes;
                this.params.locationFeature = _point;
            }
            else {
                this.params.locationFeature.geometry.coordinates[0] = options.coords.longitude;
                this.params.locationFeature.geometry.coordinates[1] = options.coords.latitude;
            }
        }

    },
    drawPosition: function(position){
        
        var uid = this.uid;
        /* Obs by d3layer        
        var f =    self.core.mylocationLayer.getFeaturesByAttribute('uid', uid);
        this.core.mylocationLayer.removeFeatures(f);
        */
        if (uid == self.core.UID){
            name = self.core.MYLOCATION;
            icon = self.core.MYLOCATION_ICON;
        }
        else
        {
            name = this.options.owner;
            icon = self.core.LOCATION_ICON;
        }
        var attributes = {uid: uid, owner: name, time: position.timestamp, icon: icon};
       
        this.options.position = position;
        
        
        //For d3 layer: create generic geojson point
        this.params.pointfeature = { 
            "id": this.uid,
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    position.coords.longitude, position.coords.latitude
                ]
            },
            "properties": attributes
        };
        self.core.trigger("peerPositionChanged", core.getPeerPositions());
    },
    
    _onUpdatePeer: function(evt, payload) {
        var self = evt.data.widget;
        if(payload.owner) {
            self.options.owner = payload.owner;
        }
        if(payload.herd) {
            self.options.herd = payload.herd;
        }
        if (payload.extent) {
            self.view({extent: payload.extent});
        }
        if(payload.position) {
            self.position(payload.position);
        }
        
        self.core.trigger('peerupdated');
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



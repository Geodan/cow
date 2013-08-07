$.Cow.Peer.prototype = {
    
    /*    var self = this;
    this.core = core;
    this.options = options;
    this.uid = options.uid;
    */
    //SMO: moet er wel een extent() functie zijn?
    extent: function(bbox) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getExtent();
        case 1:
            if (!$.isArray(bbox)) {
                return this._setExtent(bbox);
            }
            else {
                throw('wrong argument number, only one extent allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getExtent: function() {
        return this.bbox;
    },
    _setExtent: function(bbox) {
        this.options.extent = bbox;
        this.bbox = bbox;
        this.view(bbox);
        
    },
    
    view: function(bbox) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getView();
        case 1:
            if (!$.isArray(bbox)) {
                return this._setView(bbox);
            }
            else {
                throw('wrong argument number, only one extent allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getView: function() {
        return this.params.viewfeature;
    },
    _setView: function(bbox) {    
        
        
        
        if(bbox.type !==undefined){
             this.params.viewfeature = bbox;
        }
        else this.params.viewfeature = this._bbox2view(bbox);    
        if(this.params.feature !== undefined) {
            this._drawExtent()
        }
        
        //TODO: trigger een redraw van de polygon?
        //console.log('view: '+JSON.stringify(this.viewfeature));
    },
    _drawExtent: function() {
        this.params.oldfeature = feature;
        var geojson_format = new OpenLayers.Format.GeoJSON();
        var feature = geojson_format.read(this.params.viewfeature);
        
        this.params.feature = feature;        
        var p = {  "id": this.uid,
                   "type": "Feature",
                   "geometry": {
                        "type": "Point",
                        "coordinates": this.view().geometry.coordinates[0][1]
                    },
                    "properties": {
                        "uid": this.uid,
                        "label": this.options.owner
                    }
            }            
        var point = geojson_format.read(p);
        this.params.point = point;
        self.core.trigger("peerExtentChanged", core.getPeerExtents());
    },
    
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
        //Obsolete
        //var proj = new OpenLayers.Projection("EPSG:4326");
        //var toproj = new OpenLayers.Projection("EPSG:900913");
        //var point = new OpenLayers.Geometry.Point(position.coords.longitude,position.coords.latitude);
        
        //point.transform(proj, self.core.map.getProjectionObject()); //Getting rid of references to map
        //point.transform(proj, toproj); //TT: removed transformation for leaflet
        /*Obs by d3 layer
        var pointfeature = new OpenLayers.Feature.Vector(point, attributes);
        this.core.mylocationLayer.addFeatures([pointfeature]);
        */
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
    },
    _onMoved: function(evt,payload) {
        var self = evt.data.widget;
        //console.log('peerupdated');
        self.core.trigger('peerupdated');
        //TODO: options worden niet automatisch bijgewerkt
        self.options.owner = payload.owner;
        self.extent(payload.extent);    
    },
    _onLocationChanged: function(evt, payload){
        //when I change my location, redraw my point
        var position = payload.position;
        var self = evt.data.widget;
        self.drawPosition(position);
    },
    _onParamsChanged: function(evt, payload){
        //when I change my params, redraw my point and update lists
        var herd = payload.herd;
        var name = payload.name;
        var self = evt.data.widget;
        self.options.owner = name;
        self.options.herd = herd;
        //TODO redraw list and map
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



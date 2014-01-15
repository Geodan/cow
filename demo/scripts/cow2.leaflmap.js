Cow.leaflmap = function(config){
    var self = this;
    this.project = null;
    this.core = config.core;
    this.bbox = [-180, -85, 180, 85];
    this.bboxMax= [-180, -85, 180, 85];
    this.center= [0, 0];
    this.dummyfeature = { "id": 0,
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [ 0, 1],[0,3],[2,3],[2,1],[0,1]
                ]]
            },
         "properties": {
            "uid":0,
            "owner": 0,
            "label":""
        }
    };
    
    this._map = L.map('map', {}).setView([52.083726,5.111282], 9);//Utrecht
    this._map.core = core; //TODO, needed for d3layer_utils context menus, but not so nice
    this._map.on('moveend',function(e){
        self.handleNewExtent(e);
        d3.selectAll('.popup').remove();//Remove all popups on map
    });
    this._map.on("viewreset", function(e){
        //this.handleNewExtent(e);
    });
    this._map.on('click',function(e){
        d3.selectAll('.popup').remove();//Remove all popups on map
        self.controls.editcontrol.save();
        self.controls.editcontrol.disable();
        //self.editLayer.clearLayers();
    });
    
    this._createLayers(this._map);
    this.handleOnLoad();
    
    this.core.peerStore().on('datachange', function(e){
       self._onPeerStoreChanged();     
    });
    
    /*OBS by projectChanged?    
    this.core.projectStore().on('datachange', function(e){
       self._reloadLayer();
       self.core.project().itemStore().on('datachange', function(e){ //TODO
            self._reloadLayer();
       });
       
    });
    */
    this.core.websocket().on('zoomTo', function(location){
       console.log('Zooming to: ',location);
       self._map.setView([location.latitude,location.longitude],location.level);
    });
    
    this.core.on('projectChanged', function(){
       self._reloadLayer();
       self.core.project().itemStore().on('datachange', function(e){ //TODO
            self._reloadLayer();
       });     
    });
    this.core.on('myLocationChanged', function(){
            self._onMyLocationChanged();
    });

    
    return this;
};
        
Cow.leaflmap.prototype = 
{
    map: function(){
        return this._map;
    },



    handleOnLoad: function(){
        var bounds = this._map.getBounds();
        var extent = {
            left: bounds.getWest(),
            bottom: bounds.getSouth(),
            right: bounds.getEast(),
            top: bounds.getNorth()
        };
        //TODO self.core.me() && self.core.me().view({extent:extent}); //Set my own extent
    },
		
    handleNewExtent: function(e){
        var bounds = e.target.getBounds();
        var bbox = {
            left: bounds.getWest(),
            bottom: bounds.getSouth(),
            right: bounds.getEast(),
            top: bounds.getNorth()
        };
        var b = [bbox.left,bbox.bottom,bbox.right,bbox.top];
        var peerid = this.core.peerid();
        var username = this.core.user().data('name'); 
        var feature = { "id": peerid,
                        "type": "Feature",
                        "geometry": {
                            "type": "Polygon",
                            "coordinates": [
                                [ [b[0], b[1]],[b[0],b[3]],[b[2],b[3]],[b[2],b[1]],[b[0],b[1]]
                                ]
                            ]
                        },
                     "properties": {
                        "uid":peerid,
                        "owner": username,
                        "label":""
                    }
                };
        if (core.peerid()){
            var peer = core.peers(core.peerid());
            peer.data('extent',feature).sync();
        }
    },
    
	getExtent: function(){
		var bounds = this._map.getBounds();
		var extent = {
			left: bounds.getWest(),
			bottom: bounds.getSouth(), 
			right: bounds.getEast(),
			top: bounds.getNorth()
		};
		return extent;
	},
	getControls: function(){
		return this.controls;
	},
	
	_onMyLocationChanged: function(){
	    var myLocationCollection = {"type":"FeatureCollection","features":[]};
	    myLocationCollection.push(self.core.location());
	    if (self.myLocationLayer){
	        self.myLocationLayer.data(myLocationCollection);
	        self.myLocationLayer.updateData(self._map);
	    }
	},
	
	//Anything changed in the peers store results in redraw of peer items (extents & points)
	_onPeerStoreChanged: function() {
	    //var self = evt.data.widget;
	    var self = this;
	    var extentCollection = {"type":"FeatureCollection","features":[]};
	    var locationCollection  = {"type":"FeatureCollection","features":[]};
	    var peers = icm.peers();
	    for (i=0;i<peers.length;i++){
	        var peer = peers[i];
	        if (peer.data('extent') && peer.id() != self.core.peerid()){
	            extentCollection.features.push(peer.data('extent'));
	        }
	        if (peer.data('location') && peer.id() != self.core.peerid()){
	            //Own location is handled somewhere else
	            locationCollection.features.push(peer.data('location'));
	        }
	    }
	    //Update layer with extents
	    if (self.extentLayer){
			//self.extentLayer.clearLayers();
			//self.extentLayer.addData(extentCollection);
			self.extentLayer.data(extentCollection);
		    self.extentLayer.updateData(self._map);
		}
		//Update layer with locations
		if (self.locationLayer){
		    //self.locationLayer.clearLayers();
			//self.locationLayer.addData(locationCollection);
			self.locationLayer.data(locationCollection);
			self.locationLayer.updateData(self._map);
		}
	},
	
	_zoomToPeersView: function(evt, bbox){
	    var self = evt.data.widget;
	    var bt = new L.LatLng(bbox.bottom, bbox.left),
	        ur = new L.LatLng(bbox.top, bbox.right),
	        bounds = new L.LatLngBounds(bt, ur);
	    self.map.fitBounds(bounds);
	},
	_zoomToPeersLocation: function(evt, location){
	    var self = evt.data.widget;
	    self.map.setView([location.latitude,location.longitude],9);
	},
	

	_reloadLayer: function(){
	    console.log('Reloadlayer');
	    var self = this;
	    
	    //Start with featureCollections
	    var collections = icm.featureCollections();
	    for (i=0;i<collections.length;i++){
	        var layer = new L.GeoJSON(collections[i].data('featureCollection'));
	        if (!this._map.hasLayer(layer)){
	                this._map.addLayer(layer);
	        }
	    }
	    //End featCollections
	    
		self.editLayer.clearLayers(); //Remove existing leaflet features in editlayers (only d3 feats remaining) 
		var editCollection = {"type":"FeatureCollection","features":[this.dummyfeature]}; //FIXME
		var viewCollection = {"type":"FeatureCollection","features":[this.dummyfeature]}; //FIXME
		//TODO
		var items = icm.features('edit');
		var mygroups = self.core.project().myGroups();
		for (i=0;i<items.length;i++){
		    var item = items[i];
			var feature = item.data('feature');
            if(feature === undefined) {
                console.warn('old item type');
                return false;
            }
            else{
                //Add feature
                var opacity = 1;
                feature.id = feature.properties.key;
                feature.properties.name = item.data('name'); 
                feature.style = {
                    icon: feature.properties.icon,
                    stroke: feature.properties.linecolor,
                    fill:  feature.properties.polycolor,
                    "fill-opacity": 0.5,
                    //"fill-opacity": opacity,
                    opacity: opacity
                };
                feature.id = feature.properties.key = item.id();
                //Workaround for lines with a fill
                if (feature.geometry.type == 'LineString'){
                    feature.style.fill = 'none';
                }
                editCollection.features.push(feature);
			}
		}
		if (self.editLayer){
			self.editLayer.data(editCollection);
		    self.editLayer.updateData(self._map);
		}
	},
	
	
	_createLayers: function(map) {
		var self = this;

		var dummyCollection = {"type":"FeatureCollection","features":[this.dummyfeature]};
		
		this.myLocationLayer = new L.GeoJSON.d3(dummyCollection, {
		        labels: false,
		        style:{
		            fill: 'red',
		            stroke: 'red'
		        }
		});
		this._map.addLayer(this.myLocationLayer);
		
		this.extentLayer = new L.GeoJSON.d3(dummyCollection, {
		    labels: true,
			labelconfig: {
                field: "owner",
                style: {
                    stroke: "steelBlue"
                }
            },
			style: {
					fill: "none",
					stroke: "steelBlue",
					'stroke-width': 2,
					textlocation: "ul"
			}
        });
        this._map.addLayer(this.extentLayer);
		
        this.locationLayer = new L.GeoJSON.d3(dummyCollection, {
          labels: true,
			labelconfig: {
				field:"owner",
				style: {
				    stroke: "#000033"
					}
			},
			style: {
			    fill: "grey",
				fill: "steelBlue"
			}
        });
        this._map.addLayer(this.locationLayer);
                
        this.editLayer = new L.GeoJSON.d3(dummyCollection, {
            onClick: cow.menu,
            //onMouseover: cow.textbox,
            labels: true,
            labelconfig: {
                field: "name",
                style: {
                    stroke: "#000033"
                    //stroke: "steelBlue"
                }
            },
            style: {
                fill: "none",
                stroke: "steelBlue",
                'stroke-width': 2,
                opacity: 0.5
			}
        });
        this._map.addLayer(this.editLayer);
		
        
        
		/** Here comes the big bad editlayer.. **/
		
		this.layerstyle  = function (feature) {
			var icon = L.icon({
					iconUrl: feature.properties.icon,
					iconSize: [40, 40]
			});
			var style = {
				icon: icon,
				color: feature.properties.linecolor,
				fillColor:  feature.properties.polycolor
				
			};
			return style;
		};
		
		function highlightFeature(e) {
			var layer = e.target;
			if (layer.feature.geometry.type != "Point"){ //TODO: this is a workaround. In fact, we want to know whether it is a Marker layer or not 
				layer.setStyle({
					weight: 5,
					color: '#666',
					dashArray: '',
					fillOpacity: 0.7
				});
			
				if (!L.Browser.ie && !L.Browser.opera) {
					layer.bringToFront();
				}
			}
			else{
			    layer.setStyle({
					opacity: 0.5,
					fillOpacity: 0.5
				});
			}
		}
		function resetHighlight(e) {
			self.editLayer.resetStyle(e.target);
		}
		function zoomToFeature(e) {
			self.map.fitBounds(e.target.getBounds());
		}
		
		// Initialize the draw control and pass it the FeatureGroup of editable layers
		this.drawControl = new L.Control.Draw({
			draw: true,
			draw: {
			    circle: false
			},
			edit: {
				//featureGroup: self.editLayer,
				featureGroup: this.editLayer,
				edit: false,
				remove: false
			}
		});
		L.drawLocal.edit.handlers.edit.tooltip.subtext = '';

		this._map.addControl(this.drawControl);
		
		this._map.on("draw:edited", function(e,x){
				var layers = e.layers;
				
				layers.eachLayer(function (layer) {
				    var feature = layer.toGeoJSON();
				    //First transform into featurestore item
                    var item = core.project().items(feature.properties.key) //TODO
                        .data('feature',feature)
                        .sync();
				});
				self.editLayer.clearLayers();
				self._reloadLayer();
				
				//TODO: hack to remove svg layer that is created by leaflet draw upon drawing
				d3.select('.leaflet-overlay-pane').select('.leaflet-zoom-animated').remove();
		});
		this._map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;
			var feature = layer.toGeoJSON();
		
            var d = new Date();
            var timestamp = d.getTime();
            feature.properties.icon = self.core.current_icon; //TODO TT: not nice
            feature.properties.linecolor = "aliceBlue";
            feature.properties.fillcolor = "green";
            feature.properties.polycolor = "red";
            feature.properties.key = self.core.UID + "_" + timestamp;
            //feature.properties.store = self.core.activeproject();
            feature.properties.creator = self.core.user().data('name');
            feature.properties.owner = self.core.user().data('name');

            var id = self.core.peerid() + "_" + timestamp;
            
            var item = core.project().items(id)
                .data('type','feature')
                .data('feature', feature)
                .permissions('view',self.core.project().myGroups())//Set default permissions to my groups
                .permissions('edit',self.core.project().myGroups())//Set default permissions to my groups
                .permissions('share',self.core.project().myGroups())//Set default permissions to my groups
                .sync();
            self.editLayer.clearLayers();
            self._reloadLayer();
 
		});
		
		//See following URL for custom draw controls in leaflet
		//http://stackoverflow.com/questions/15775103/leaflet-draw-mapping-how-to-initiate-the-draw-function-without-toolbar
		
		this.controls = {
//			modify: new OpenLayers.Control.ModifyFeature(editlayer),
			//add: new OpenLayers.Control.EditingToolbar(editlayer),
//			select: new OpenLayers.Control.SelectFeature(editlayer),
			pointcontrol: new L.Draw.Marker(this._map, this.drawControl.options.Marker),
			linecontrol: new L.Draw.Polyline(this._map, this.drawControl.options.polyline),  
			polycontrol:  new L.Draw.Polygon(this._map, this.drawControl.options.polygon),
			editcontrol: new L.EditToolbar.Edit(this._map, {
                featureGroup: this.drawControl.options.edit.featureGroup,
                selectedPathOptions: this.drawControl.options.edit.selectedPathOptions
            })
		};              
	},
		
	
	editfeature: function(self, feature){
		self._map.closePopup();
		//TODO!! global leaflmap
		leaflmap.controls.editcontrol.enable();
	},
	deletefeature: function(self,feature, layer){
		var key = feature.properties.key;
		core.project().items(key).deleted('true').sync();
		self._map.closePopup();
	},                
	changeFeature: function(self, feature){
	    var desc = document.getElementById('descfld').value;
        //feature.properties.name = document.getElementById('titlefld').value; //TODO. Yuck, yuck yuck....
        feature.properties.desc = desc;
        feature.properties.owner = self._map.core.user().data('name');
        self._map.closePopup(); //we have to destroy since the next line triggers a reload of all features
		//if (self.core.activeproject() == feature.properties.store){
            var key = feature.properties.key;
            var item = self._map.core.project().items(key)
                .data('feature', feature)
                .data('msg',desc)
                .sync();
        //}
        //self.editLayer.clearLayers();
	},
	closepopup: function(self){
	    d3.select('#featurepopup').html('');//TODO
		self._map.closePopup();
	}
};




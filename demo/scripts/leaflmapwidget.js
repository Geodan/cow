/*$.Cow.ConnectWidget = {
init: function(){
var widget = $('#connect');
var cow = $('#cow').data('cow');
cow.events.bind('connected',{}, this._onConnect);
},
_onConnect: function() {
}
}
*/



(function($) {

var _defaultOptions = {
        bbox: [-180, -85, 180, 85],
        bboxMax: [-180, -85, 180, 85],
        center: [0, 0],
        // The cow.core instance
        core: undefined
};

$.widget("cow.LeaflMapWidget", {
	options: $.extend({}, _defaultOptions),
	
 	_create: function() {
        var core;
        var self = this;		
        var element = this.element;
        this._d3layers = [];
        core = $(this.options.core).data('cow');
		this.core=core;
		
        core.bind("storeChanged", {widget: self}, self._onItemStoreChanged);
		core.bind("peerStoreChanged", {widget: self}, self._onPeerStoreChanged);
		core.bind("projectListChanged",  {widget: self}, self._onPeerStoreChanged);
		//core.bind("layoutChanged", {widget: self},self._updateSize);
		core.bind("zoomToExtent", {widget: self},self._zoomToPeersView);
		core.bind("zoomToPoint", {widget: self},self._zoomToPeersLocation);
		core.bind("myPositionChanged",{widget: self},self._onPeerStoreChanged);
		
		//Creating the leaflet map
		this.map = L.map('map',{ 
			zoomControl:false
		})
		//.setView([52.083726,5.111282], 9);//Utrecht
		.setView([52.341921,4.912838], 17);//Geodan Adam
		
		// add an OpenStreetMap tile layer
		var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);
		
		//Layer controls
		//var baseLayers = {"OSM": osmLayer};
		//L.control.layers(baseLayers).addTo(this.map);
		
		$('#peers').bind("zoomToPeersview", function(evt, bbox){
			self.map.fitBounds([[bbox.bottom,bbox.left],[bbox.top,bbox.right]]);
		});
		
		var handleOnLoad = function(){
		    var bounds = self.map.getBounds();
            var extent = {
                left: bounds.getWest(),
                bottom: bounds.getSouth(),
                right: bounds.getEast(),
                top: bounds.getNorth()
            };
            self.core.me() && self.core.me().view({extent:extent}); //Set my own extent
            //Reset/redraw layers
            self._d3layers.forEach(function(l){
                    l.reset();
            });
		};
		
		var handleNewExtent = function(e){
				var bounds = e.target.getBounds();
				var extent = {
					left: bounds.getWest(),
					bottom: bounds.getSouth(),
					right: bounds.getEast(),
					top: bounds.getNorth()
				};
				self.core.me() && self.core.me().view({"extent":extent}); //Set my own extent
				//Reset/redraw layers         
				self._d3layers.forEach(function(l){
                    l.reset(e);
                });
		};
		this._createLayers(this.map);
		handleOnLoad();
				
		this.map.on('moveend',function(e){
				handleNewExtent(e);
		});
		this.map.on("viewreset", function(e){
		        //handleNewExtent(e);
		});
		this.map.on('click',function(e){
				self.controls.editcontrol.save();
				self.controls.editcontrol.disable();
		});
//		this.controls.select.activate();
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
    //Setter/getter for d3layers
    d3Layers: function(layerobj) {
        //TODO: check for existing layer on push
        if (layerobj) this._d3layers.push(layerobj);
        else return this._d3layers;
    },
    //Getter for d3 layer by name
    getD3LayerByName: function(name){
        //TODO: what a weird method the get the layer. Can't be done easier?
        var returnlayer;
        this._d3layers.forEach(function(layer){
           if (layer.layername === name) {
               returnlayer = layer;
           }
        });
        return returnlayer;
    },
	_onItemStoreChanged: function(evt) {
		//console.log('_onLoaded');
		var self = evt.data.widget;
		self._updateMap(evt);
	},
	_onNewItem: function(evt) {
		//console.log('_onNewFeature');
		var self = evt.data.widget;
		self._updateMap(evt);
	},
	_updateMap: function(evt) {		
		var self = evt.data.widget;
		self._reloadLayer(); 
	},
	getExtent: function(){
		var bounds = this.map.getBounds();
		var extent = {
			left: bounds.getWest(),
			bottom: bounds.getSouth(), 
			right: bounds.getEast(),
			top: bounds.getNorth()
		}
		return extent;
	},
	getControls: function(){
		return this.controls;
	},
	//Anything changed in the peers store results in redraw of peer items (extents & points)
	_onPeerStoreChanged: function(evt) {
	    var self = evt.data.widget;
	    var extentCollection = self.core.getPeerExtents();
	    var locationCollection = self.core.getPeerPositions();
	    //Update layer with extents
	    if (self.viewlyr){
			self.viewlyr.data(extentCollection);
		}
		//Update layer with locations
		if (self.getD3LayerByName('viewlayer')){
			self.getD3LayerByName('viewlayer').data(extentCollection);
		}
		//Update layer with locations
		if (self.getD3LayerByName('locationlayer')){
		    $.each(locationCollection.features, function(i,d){
                var style = {}; 
                if (d.id == self.core.me().uid)
                    style.fill = "red";
                else style.fill = "steelBlue";
                d.style = style;
            });
			self.getD3LayerByName('locationlayer').data(locationCollection);
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
	

	_reloadLayer: function(e){
	    var self = this;
		self.editLayer.clearLayers();
        //TODO: make sure it only requests items with type 'feature'
		var items = self.core.itemstore().items();
		var collection = {"type":"FeatureCollection","features":[]};
		$.each(items, function(i, item){
			var feature = item.data();
            if(feature === undefined) {
                console.warn('old item type');
                //return false;
            }
            else{
                feature.id = feature.properties.key;
                
                feature.style = {
                    icon: feature.properties.icon,
                    stroke: feature.properties.linecolor,
                    fill:  feature.properties.polycolor,
                    "fill-opacity": 0.5
                } 
                
                if (item.status() != 'deleted'){
                    collection.features.push(feature);
                    //self.editLayer.addData(feature)
                    //	.setStyle(self.layerstyle);
                }
			}
		});
		self.getD3LayerByName('editlayer').data(collection);
	},
	
	
	_createLayers: function(map) {
		var self = this;
		
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
			} 
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
		}
		function resetHighlight(e) {
			self.editLayer.resetStyle(e.target);
		}
		function zoomToFeature(e) {
			self.map.fitBounds(e.target.getBounds());
		}
		
		/* Obsolete 
		function openPopup(e) {
			var feature = e.target.feature;
			var layer = e.layer;
			var name = feature.properties.name || "";
			var desc = feature.properties.desc || "";
			var innerHtml = ''
					+ 'Label: <input id="titlefld" name="name" value ="'+name+'""><br/>'
					+ 'Description: <br> <textarea id="descfld" name="desc" rows="4" cols="25">'+desc+'</textarea><br/>'
					+ '<button class="popupbutton" id="editButton">edit</button><br />'
					+ '<button class="popupbutton" id="deleteButton"">delete</button><br />'
					+ '<button class="popupbutton" id="closeButton"">Done</button>';
			
			var popup = L.popup()
				.setLatLng(e.latlng)
				.setContent(innerHtml)
				.openOn(self.map);
			
			var editbtn = document.getElementById('editButton');
			//editbtn.addEventListener("touchstart", function(){
			//		self.editfeature(self,feature);
			//}, false);
			editbtn.addEventListener("click", function(){
					self.editfeature(self,feature);
			}, false);
			
			var deletebtn = document.getElementById('deleteButton');
			//deletebtn.addEventListener("touchstart", function() {
			//	self.deletefeature(self,feature);
			//}, false);
			deletebtn.addEventListener("click", function() {
				self.deletefeature(self,feature);
			}, false);
			
			var closebtn = document.getElementById('closeButton');
			//closebtn.addEventListener("touchstart", function(){self.closepopup(self);}, false);
			closebtn.addEventListener("click", function(){
			    self.changeFeature(self, feature);
			}, false);
		}*/
		function onEachFeature(feature, layer) {
		    /*
			layer.bindLabel(feature.properties.name,{ noHide: true });
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: openPopup //Replaced by d3 layer click
			});
			*/
		}
		
		var editlayer = L.geoJson(null,{
				style: this.layerstyle,
				onEachFeature: onEachFeature,
				pointToLayer: function (feature, latlng) {
					return L.marker(latlng, {
							icon: L.icon({
									iconUrl: feature.properties.icon,
									iconSize: [40, 40]
							})
					})//.bindLabel(feature.properties.name,{noHide: true})
					;
				}
		}
		).addTo(this.map);
		
		// Initialize the draw control and pass it the FeatureGroup of editable layers
		this.drawControl = new L.Control.Draw({
			draw: false,
			edit: {
				featureGroup: editlayer,
				edit: false,
				remove: false
				
			}
			
		});

		this.map.addControl(this.drawControl);
		/*Obsolete by new draw:created listener
		this.map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;

			//TODO: sent feature
			self.editLayer.addLayer(layer);
		});
		*/
		this.map.on("draw:edited", function(e,x){
				var layers = e.layers;
				
				layers.eachLayer(function (layer) {
				    var feature = layer.toGeoJSON()
				    //First transform into featurestore item
                    var item = core.itemstore().getItemById(feature.properties.key);
                    var d = new Date();
                    var timestamp = d.getTime();
                    item.data(feature);
                    //item.changer(self.core.UID);
                    item.timestamp(timestamp);
                    core.itemstore().items('feature',{data:item.flatten()},'user');
					//core.trigger('afterfeaturemodified',layer.toGeoJSON());
				});
				
		});
		this.map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;
			var feature = layer.toGeoJSON();
            //TODO: $.cow.item
			
            var d = new Date();
            var timestamp = d.getTime();
            feature.properties.icon = self.core.current_icon; //TODO TT: not nice
            feature.properties.linecolor = self.core.current_linecolor;
            feature.properties.fillcolor = self.core.current_fillcolor;
            feature.properties.polycolor = self.core.current_polycolor;
            feature.properties.key = self.core.UID + "#" + timestamp;
            feature.properties.store = self.core.activeproject();
            feature.properties.creator = self.core.username();
            feature.properties.owner = self.core.username();
            var item = {
                _id: self.core.UID + "#" + timestamp,
                creator: self.core.UID,
                //changer: self.core.UID,
                type: 'feature',
                data: feature
            };
            core.itemstore().items('feature',{data: item}, 'user');
		});
		
		//See following URL for custom draw controls in leaflet
		//http://stackoverflow.com/questions/15775103/leaflet-draw-mapping-how-to-initiate-the-draw-function-without-toolbar
		
		this.controls = {
//			modify: new OpenLayers.Control.ModifyFeature(editlayer),
			//add: new OpenLayers.Control.EditingToolbar(editlayer),
//			select: new OpenLayers.Control.SelectFeature(editlayer),
			pointcontrol: new L.Draw.Marker(this.map, this.drawControl.options.Marker),
			linecontrol: new L.Draw.Polyline(this.map, this.drawControl.options.polyline),  
			polycontrol:  new L.Draw.Polygon(this.map, this.drawControl.options.polygon),
			editcontrol: new L.EditToolbar.Edit(this.map, {
                featureGroup: this.drawControl.options.edit.featureGroup,
                selectedPathOptions: this.drawControl.options.edit.selectedPathOptions
            })
		}                 
		
        
		$('#newfeatpanel').bind("newpoint", function(evt, key){
			self.controls.linecontrol.disable();
			self.controls.polycontrol.disable();
			self.controls.pointcontrol.enable();
			var Licon = L.icon({
					iconUrl: key,
					iconSize: [40, 40]
			});
			self.controls.pointcontrol.setOptions({icon: Licon});
			var layer = self.editLayer;
			core.current_icon = key;
		});
		$('#newfeatpanel').bind("newline", function(evt, key){
			self.controls.pointcontrol.disable();
			self.controls.polycontrol.disable();
			self.controls.linecontrol.enable();
			var layer = self.editLayer;
			core.current_linecolor = key;
		});
		$('#newfeatpanel').bind("newpoly", function(evt, key){
			self.controls.linecontrol.disable();
			self.controls.pointcontrol.disable();
			self.controls.polycontrol.enable();
			var layer = self.editLayer;
			core.current_linecolor = key;
        	core.current_polycolor = key;
		});
		
		
		this.editLayer = editlayer;
		core.editLayer = editlayer; //DEBUG
		/*this.editLayer.events.on({
			scope: this,
			sketchcomplete: this.handlers.includeFeature//this.handlers.simple		
		})*/;		

		
		
		

//		this.editLayer.events.register('afterfeaturemodified',{'self':this,layer:editlayer},function(evt){core.trigger('afterfeaturemodified',evt.feature)});
		//this.editLayer.events.on({'featureselected': function(){
		//		alert('Feat selected');
		//}});
//		this.controls.select.activate();
		/** End of the big bad editlayer **/
		
		var editPopup = function(d){
		    var feature = d;
		    var key = feature.properties.key || "";
            var name = feature.properties.name || "";
            var desc = feature.properties.desc || "";
            var creator = feature.properties.creator || "unknown";
            var owner = feature.properties.owner || "unknown";
		    var innerHtml = ''
                    //+'<input onBlur="">Title<br>'
                    //+'<textarea></textarea><br>'
                    //+ 'You can remove or change this feature using the buttons below<br/>'
                    + '<input id="popupid" type="hidden" name="popupid" value ="'+key+'"">'
                    + translator.translate('Label') + ': <input id="titlefld" name="name" value ="'+name+'""><br/>'
                    + translator.translate('Description') + ': <br> <textarea id="descfld" name="desc" rows="4" cols="25">'+desc+'</textarea><br/>'
                    + '<small>' + translator.translate('Created_by') + ': <i>'+ creator + '</i></small><br>'
                    + '<small>' + translator.translate('Last_edit_by') + ': <i>'+ owner + '</i></small><br>'
                    + '<button class="popupbutton" id="editButton">' + translator.translate('edit')+'</button><br>'
                    + '<button class="popupbutton" id="deleteButton"">' + translator.translate('delete')+'</button>'
                    + '<button class="popupbutton" id="closeButton"">' + translator.translate('Done')+'</button>'
                    + '<button class="popupbutton" id="routeButton"">' + translator.translate('Route')+'</button>';
            $('#debugpopup').html(innerHtml);
            self.editLayer.addData(feature);
            var editbtn = document.getElementById('editButton');
            editbtn.addEventListener("click", function(){
					self.editfeature(self,feature);
			}, false);
			var deletebtn = document.getElementById('deleteButton');
			deletebtn.addEventListener("click", function() {
				self.deletefeature(self,feature);
			}, false);
			var closebtn = document.getElementById('closeButton');
			closebtn.addEventListener("click", function(){
			    self.changeFeature(self, feature);
			}, false);
			var routebtn = document.getElementById('routeButton');
			routebtn.addEventListener("click", function(){
			    self.findRoute(self, feature);
			}, false);
		};
		
		var d3editlyr = new d3layer("editlayer",{
		    maptype: "Leaflet",
			map: self,
			onClick: editPopup,
			type: "path",
			labels: true,
			labelconfig: {
                field: "name",
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
        self.d3Layers(d3editlyr);
		var viewlyr = new d3layer("viewlayer",{
			maptype: "Leaflet",
			map: self,
			type: "path",
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
        self.d3Layers(viewlyr);
        
		var locationlyr = new d3layer("locationlayer",{
			maptype: "Leaflet",
			map: self,
			type: "circle",
			coolcircles: true,
			satellites: false,
			videobox: true,
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
		self.d3Layers(locationlyr);
		
		var routelayer = new d3layer("routelayer",{
            maptype: "Leaflet",
            map: self,
            type: "path",
            style: {
                stroke: "purple",
                'stroke-width': '3px',
                fill: 'none',
                'stroke-opacity': 0.8,
                'fill-opacity': 0.2
            }
        });
        self.d3Layers(routelayer);
	},
	
	editfeature: function(self, feature){
		self.map.closePopup();
		self.controls.editcontrol.enable();
	},
	deletefeature: function(self,feature, layer){
		//var feature = item.target.feature; 
		var key = feature.properties.key;
		var store = feature.properties.store || "store1";
		core.itemstore().removeItem(key);
		self.map.closePopup();
		core.trigger('storeChanged');
	},                
	changeFeature: function(self, feature){
        feature.properties.name = document.getElementById('titlefld').value; //TODO. Yuck, yuck yuck....
        feature.properties.desc = document.getElementById('descfld').value;
        feature.properties.owner = self.core.username();
        self.map.closePopup(); //we have to destroy since the next line triggers a reload of all features
		if (self.core.activeproject() == feature.properties.store){
		    //core.featurestore().updateLocalFeat(feature);
            var item = core.itemstore().getItemById(feature.properties.key);
            var d = new Date();
            var timestamp = d.getTime();
            item.data(feature);
            item.timestamp(timestamp);
            //self.core.itemstore().items('feature',{data:item}, 'user');
        }
        //self.editLayer.clearLayers();
	},
	closepopup: function(self){
	    $('#debugpopup').html('');//TODO
		self.map.closePopup();
	},
	findRoute: function(self, feature){    
	    var routefeats = {"type": "FeatureCollection","features":[]};
	    var mypoint = self.core.me().position().point.coords;
	    var topoint = L.geoJson(feature).getBounds().getCenter();
	    //var topoint = feature.geometry.coordinates;
	    var fromcoordx = mypoint.longitude;
        var fromcoordy = mypoint.latitude;
        var tocoordx = topoint['lng'];
        var tocoordy = topoint['lat'];
        var url = "http://services.geodan.nl/data/route?Request=getroute&fromcoordx="+fromcoordx+"&fromcoordy="+fromcoordy+"&tocoordx="+tocoordx+"&tocoordy="+tocoordy+"&returntype=coords&srs=epsg:4326&routetype=fastest&format=min-km&outputformat=geojson&uid=tom_demo_6324b0360cc87fc0b70225c8fd29210";
        var respons = function(data){
            data.features.forEach(function(d){
               d.id = new Date().getTime();
               d.style = {'stroke':'blue'};
               if (d.properties.distance > 40) d.style.stroke = 'red';
               else if (d.properties.distance > 30) d.style.stroke = 'orange';
               else d.style.stroke = 'green';
               d.mouseoverhtml = Math.round(d.properties.distance) + "km  / " + Math.round(d.properties.duration) + "min.";
               routefeats.features.push(d);     
            });
            var routelayer = self.getD3LayerByName('routelayer');
            routelayer.data(routefeats);
        }
        
        d3.json(url, function(data){
           respons(data); 
        });
	}
	
	
	});
})(jQuery);



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


/**
	TT: copied from featureswidget.js and adapted for map purpose
**/



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
        
        core = $(this.options.core).data('cow');
		this.core=core;
        core.bind("storeChanged", {widget: self}, self._onFeatureStoreChanged);
		core.bind("peerStoreChanged", {widget: self}, self._onPeerStoreChanged);
		//core.bind("layoutChanged", {widget: self},self._updateSize);
		core.bind("zoomToExtent", {widget: self},self._zoomToPeersView);
		core.bind("zoomToPoint", {widget: self},self._zoomToPeersLocation);
		
		//Creating the leaflet map
		this.map = L.map('map',{ 
			zoomControl:false
		})
		.setView([52.083726,5.111282], 9);//Utrecht
		
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
		
		
		var handleNewExtent = function(data){
				var bounds = data.target.getBounds();
				var extent = {
					left: bounds.getWest(),
					bottom: bounds.getSouth(),
					right: bounds.getEast(),
					top: bounds.getNorth()
				};
				self.core.me() && self.core.me().view({"extent":extent}); //Set my own extent
				self.viewlyr.reset();
				self.locationlyr.reset();
		};
		this._createLayers(this.map);
		
				
		this.map.on('moveend',function(e){
				handleNewExtent(e);
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
	_onFeatureStoreChanged: function(evt) {
		//console.log('_onLoaded');
		var self = evt.data.widget;
		self._updateMap(evt);
	},
	_onNewFeature: function(evt) {
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
	//Anything changed in the peers store results in redraw of peer features (extents & points)
	_onPeerStoreChanged: function(evt) {
	    var self = evt.data.widget;
	    var extentCollection = self.core.getPeerExtents();
	    var locationCollection = self.core.getPeerPositions();
	    //Update layer with extents
	    if (self.viewlyr){
			self.viewlyr.data(extentCollection);
		}
		//Update layer with locations
		if (self.locationlyr){
		    $.each(locationCollection.features, function(i,d){
                var style = {}; 
                if (d.id == self.core.me().uid)
                    style.fill = "red";
                else style.fill = "steelBlue";
                d.style = style;
            });
			self.locationlyr.data(locationCollection);
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
		self.core.editLayer.clearLayers();
		var items = self.core.featurestore().getAllFeatures();
		$.each(items, function(i, object){
			var feature = object.options.feature;
			if (object.options.status != 'deleted')
				self.core.editLayer.addData(feature)
					.setStyle(self.layerstyle);
		});
	},
	
	
	_createLayers: function(map) {
		var self = this;

		self.viewlyr = new d3layer("viewlayer",{
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
        
		self.locationlyr = new d3layer("locationlayer",{
			maptype: "Leaflet",
			map: self,
			type: "circle",
			labels: true,
			labelconfig: {
				field:"owner"
			},
			style: {
				fill: "steelBlue"
			}
		});		

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
			
			
			var titlefld = document.getElementById('titlefld');
			titlefld.addEventListener("blur", function(){
					self.changeFeature(this, self, feature);
			}, false);
			var descfld = document.getElementById('descfld');
			descfld.addEventListener("blur", self.changeFeature, false);
			
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
			closebtn.addEventListener("click", function(){self.closepopup(self);}, false);
		}
		function onEachFeature(feature, layer) {
			//layer.bindLabel(feature.properties.name);
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: openPopup
			});
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
					})
					;
				}
		}
		).addTo(map);
		
		// Initialize the draw control and pass it the FeatureGroup of editable layers
		this.drawControl = new L.Control.Draw({
			draw: false,
			edit: {
				featureGroup: editlayer,
				edit: false,
				remove: false
				
			}
			
		});
		tmp = this.drawControl;
		this.map.addControl(this.drawControl);
		map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;

			//TODO: sent feature

			self.editLayer.addLayer(layer);
		});
		this.map.on("draw:edited", function(e,x){
				var layers = e.layers;
				
				layers.eachLayer(function (layer) {
				    var feature = layer.toGeoJSON()
				    core.featurestore().updateLocalFeat(feature);
					//core.trigger('afterfeaturemodified',layer.toGeoJSON());
				});
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
		core.editLayer = editlayer;
		/*this.editLayer.events.on({
			scope: this,
			sketchcomplete: this.handlers.includeFeature//this.handlers.simple		
		})*/;		

		this.map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;
			var feature = layer.toGeoJSON()
			core.featurestore().saveLocalFeat(feature);
			//self.core.trigger('sketchcomplete',layer.toGeoJSON());
		});
		
		

//		this.editLayer.events.register('afterfeaturemodified',{'self':this,layer:editlayer},function(evt){core.trigger('afterfeaturemodified',evt.feature)});
		//this.editLayer.events.on({'featureselected': function(){
		//		alert('Feat selected');
		//}});
//		this.controls.select.activate();
		/** End of the big bad editlayer **/
	},
	_onSketchComplete: function(evt, feature){
		var core = evt.data.widget.core;
		//Disable the draw control(s) after drawing a feature
/*		var controls = evt.data.widget.map.getControlsByClass('OpenLayers.Control.DrawFeature');
		$.each(controls,function(id,control){
				control.deactivate();
		});
*/	},
	
	editfeature: function(self, feature){
		self.map.closePopup();
		self.controls.editcontrol.enable();
	},
	deletefeature: function(self,feature, layer){
		//var feature = item.target.feature; 
		var key = feature.properties.key;
		var store = feature.properties.store || "store1";
		core.featurestore().removeItem(key);
		self.map.closePopup();
		console.log('storeChanged');
		core.trigger('storeChanged');
	},
	changeFeature: function(evt,self, feature){
		var key = evt.name;
		var value = evt.value;
		
		if (feature){
			var store = feature.properties.store || "store1";
			 
			if (key == "name")
				feature.properties.name = value;
			if (key == "desc")
				feature.properties.desc = value;
			self.map.closePopup(); //we have to destroy since the next line triggers a reload of all features
			core.featurestore().updateLocalFeat(feature);
		}
	},
	closepopup: function(self){
		self.map.closePopup();
	}
	
	
	});
})(jQuery);



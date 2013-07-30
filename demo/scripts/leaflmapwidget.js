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

$.widget("cow.OlMapWidget", {
	options: $.extend({}, _defaultOptions),
	
 	_create: function() {
        var core;
        var self = this;		
        var element = this.element;
        
        core = $(this.options.core).data('cow');
		this.core=core;
        core.bind("dbloaded", {widget: self}, self._onLoaded);
		core.bind("storeChanged", {widget: self}, self._onLoaded);
		core.bind("sketchcomplete", {widget: self}, self._onSketchComplete);
		
		core.bind("drawExtent", {widget: self},self._drawExtent);
		core.bind("drawPositions", {widget: self},self._drawPositions);
		core.bind("updateSize", {widget: self},function(){
//			self.map.updateSize();
		});
		core.bind("reloadFeatures",{widget: self},self._reloadLayer);
		
		
		element.delegate('.owner','click', function(){
			var key = $(this).attr('owner');
			self.core.featureStores[0].removeItem(key);
			self.core.trigger('storeChanged');
		});
		
		
		//Creating the leaflet map
		this.map = L.map('map',{ zoomControl:false}).setView([52.083726,5.111282], 9);//Utrecht

		// add an OpenStreetMap tile layer
		L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(this.map);

//		this.map.addControl(new OpenLayers.Control.LayerSwitcher());
		
		$('#peers').bind("zoomToPeersview", function(evt, bbox){
			self.map.fitBounds([[bbox.bottom,bbox.left],[bbox.top,bbox.right]]);
		});
		
		
		this.handlers = {
			// Triggers the jQuery events, after the map events
			// happened without any further processing
			simple: function(data) {
				var bounds = data.target.getBounds();
				var extent = {
					left: bounds.getWest(),
					bottom: bounds.getSouth(),
					right: bounds.getEast(),
					top: bounds.getNorth()
				};
				self.core.me() && self.core.me().extent(extent); //Set my own extent
				core.trigger(data.type, extent);
			}
        };
		this._createLayers(this.map);
		
				
		this.map.on('moveend',function(e){
				self.handlers.simple(e);
		});
//		this.controls.select.activate();
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onLoaded: function(evt) {
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
		var features = core.featureStores[0].getAllFeatures();		//TT: we only use 1 store anyway... 
        var element = self.element;
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
	
	_drawExtent: function(evt, peerCollection) {
		var self = evt.data.widget;
		if (self.viewlyr)
			self.viewlyr.data(peerCollection);
	},
	_drawPositions: function(evt, collection) {
		var self = evt.data.widget;
		//apply some styling to collection
		$.each(collection.features, function(i,d){
			var style = {}; //TODO: this goes right on Chrome desktop but wrong on chrome Beta mobile?!
			if (d.id == self.core.me().uid)
				style.fill = "red";
			else style.fill = "steelBlue";
			d.style = style;
		});
			
		if (self.locationlyr)
			self.locationlyr.data(collection);
	},
	_reloadLayer: function(e){
		self.core.editLayer.clearLayers();
		var items = self.core.getFeaturestoreByName('store1').getAllFeatures();
		$.each(items, function(i, object){
			var feature = object.options.feature;
			if (object.options.status != 'deleted')
				self.core.editLayer.addData(feature);
		});
	},
	
	
	_createLayers: function(map) {
		var self = this;

		self.viewlyr = new d3layer("viewlayer",{
			maptype: "Leaflet",
			map: self,
			type: "path",
			labels: false,
			labelconfig: {
				field: "owner"
			},
			style: {
				fill: "none",
				stroke: "steelBlue",
				'stroke-width': 2
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
		var editlayer = L.geoJson().addTo(map);
/*		
		this.controls = {
			modify: new OpenLayers.Control.ModifyFeature(editlayer),
			//add: new OpenLayers.Control.EditingToolbar(editlayer),
			select: new OpenLayers.Control.SelectFeature(editlayer),
			pointcontrol: new OpenLayers.Control.DrawFeature(editlayer,OpenLayers.Handler.Point),
			linecontrol:  new OpenLayers.Control.DrawFeature(editlayer, OpenLayers.Handler.Path),
			polycontrol:  new OpenLayers.Control.DrawFeature(editlayer, OpenLayers.Handler.Polygon)
		}
		
		for(var key in this.controls) {
                this.map.addControl(this.controls[key]);
        }
*/        
		$('#newfeatpanel').bind("newpoint", function(evt, key){
			self.controls.linecontrol.deactivate();
			self.controls.polycontrol.deactivate();
			self.controls.pointcontrol.activate();
			var layer = self.editLayer;
			core.current_icon = key;
		});
		$('#newfeatpanel').bind("newline", function(evt, key){
			self.controls.pointcontrol.deactivate();
			self.controls.polycontrol.deactivate();
			self.controls.linecontrol.activate();
			var layer = self.editLayer;
			core.current_linecolor = key;
		});
		$('#newfeatpanel').bind("newpoly", function(evt, key){
			self.controls.linecontrol.deactivate();
			self.controls.pointcontrol.deactivate();
			self.controls.polycontrol.activate();
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
//		this.editLayer.events.register('sketchcomplete',{'self':this,layer:editlayer},function(evt){core.trigger('sketchcomplete',evt.feature)});
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
	
	editfeature: function(evt,x){
/*		var feature = core.editLayer.selectedFeatures[0];
		feature.popup.hide();
		//TODO: WHY can't I reach the controls of my own class?!
		var controls = $('#map').OlMapWidget('getControls')
		controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
		controls.modify.standalone = true;
		controls.modify.activate();
		controls.modify.selectFeature(feature);
*/	},
	deletefeature: function(){
/*		var feature = core.editLayer.selectedFeatures[0];
		feature.popup.destroy();
		var key = feature.attributes.key;
		var store = feature.attributes.store || "store1";
		core.getFeaturestoreByName(store).removeItem(key);
		console.log('storeChanged');
		core.trigger('storeChanged');
*/	},
	changeFeature: function(evt){
/*		var key = evt.currentTarget.name;
		var value = evt.currentTarget.value;
		var feature = core.editLayer.selectedFeatures[0];
		if (feature){
			var store = feature.attributes.store || "store1";
			 
			if (key == "name")
				feature.attributes.name = value;
			if (key == "desc")
				feature.attributes.desc = value;
			feature.popup.destroy(); //we have to destroy since the next line triggers a reload of all features
			core.getFeaturestoreByName(store).updateLocalFeat(feature);
		}
*/	},
	closepopup: function(){
/*		var feature = core.editLayer.selectedFeatures[0];
		if (feature && feature.popup)
			feature.popup.destroy();
*/	}
	
	
	});
})(jQuery);



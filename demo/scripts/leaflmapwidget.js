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

$.widget("cow.LeafLMapWidget", {
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
		element.delegate('.owner','click', function(){
			var key = $(this).attr('owner');
			self.core.featureStores[0].removeItem(key);
			self.core.trigger('storeChanged');
		});
		
		this.map = L.map('map',{ zoomControl:false}).setView([52.083726,5.111282], 9);//Utrecht
		var osmlayer = new OpenLayers.Layer.OSM("OpenStreetMap", null, {
		   transitionEffect: 'resize'
		});
		// create the tile layer with correct attribution
		var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var osmlightUrl = 'http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png';
		var osmAttrib='Map data © OpenStreetMap contributors';
		var osm = new L.TileLayer(osmlightUrl, {opacity: 0.3,minZoom: 8, maxZoom: 30, attribution: osmAttrib});
		this.map.addLayer(osm);
		
		$('#peers').bind("zoomToPeersview", function(evt, bbox){
				self.map.zoomToExtent([bbox.left,bbox.bottom,bbox.right,bbox.top]);
		});
		
		
		this.handlers = {
			// Triggers the jQuery events, after the OpenLayers events
			// happened without any further processing
			simple: function(data) {
				var extent = data.object.getExtent();
				self.core.me().extent(extent);
				core.trigger(data.type, extent);
			}
        };
		this._createLayers(this.map);
		
				
		//this.map.events.on({
		//	scope: this,
		//	moveend: this.handlers.simple		
		//});
		
		//this.controls.select.activate();
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
		return this.map.getExtent().toBBOX();
	},
	getControls: function(){
		return this.controls;
	},
	_createLayers: function(map) {
		var drawnItems = new L.FeatureGroup();
		this.map.addLayer(drawnItems);

		var drawControl = new L.Control.Draw({
			draw: {
				position: 'topleft',
				polygon: {
					title: 'Draw a sexy polygon!',
					allowIntersection: false,
					drawError: {
						color: '#b00b00',
						timeout: 1000
					},
					shapeOptions: {
						color: '#bada55'
					},
					showArea: true
				},
				circle: {
					shapeOptions: {
						color: '#662d91'
					}
				}
			},
			edit: {
				featureGroup: drawnItems
			}
		});
		this.map.addControl(drawControl);
		map.on('draw:created', function (e) {
			var type = e.layerType,
				layer = e.layer;

			if (type === 'marker') {
				layer.bindPopup('A popup!');
			}

			drawnItems.addLayer(layer);
		});
		
		var viewlayer = {};		
		var editlayer = {};
		var mylocationlayer = {};
		
		
		
				
		/*this.controls = {
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
		
		this.map.addLayer(editlayer);
		this.map.addLayer(mylocationlayer);
		this.editLayer = editlayer;
		core.editLayer = editlayer;
		this.mylocationLayer = mylocationlayer;
		core.mylocationLayer = mylocationlayer;
				
		this.editLayer.events.register('sketchcomplete',{'self':this,layer:layer},function(evt){core.trigger('sketchcomplete',evt.feature)});
		this.editLayer.events.register('afterfeaturemodified',{'self':this,layer:layer},function(evt){core.trigger('afterfeaturemodified',evt.feature)});
		//this.editLayer.events.on({'featureselected': function(){
		//		alert('Feat selected');
		//}});
		this.controls.select.activate();
		*/
	},
	_onSketchComplete: function(evt, feature){
		var core = evt.data.widget.core;
		//Disable the draw control(s) after drawing a feature
		var controls = evt.data.widget.map.getControlsByClass('OpenLayers.Control.DrawFeature');
		$.each(controls,function(id,control){
				control.deactivate();
		});
	},
	
	editfeature: function(evt,x){
		var feature = core.editLayer.selectedFeatures[0];
		feature.popup.hide();
		//TODO: WHY can't I reach the controls of my own class?!
		var controls = $('#map').OlMapWidget('getControls')
		controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
		controls.modify.standalone = true;
		controls.modify.activate();
		controls.modify.selectFeature(feature);
	},
	deletefeature: function(){
		var feature = core.editLayer.selectedFeatures[0];
		feature.popup.destroy();
		var key = feature.attributes.key;
		var store = feature.attributes.store || "store1";
		core.getFeaturestoreByName(store).removeItem(key);
		console.log('storeChanged');
		core.trigger('storeChanged');
	},
	changeFeature: function(evt){
		var key = evt.currentTarget.name;
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
	},
	closepopup: function(){
		var feature = core.editLayer.selectedFeatures[0];
		if (feature && feature.popup)
			feature.popup.destroy();
	}
	
	
	});
})(jQuery);



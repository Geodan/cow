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
	TT: possible replacement for olmapwidget
**/

(function($) {
$.widget("cow.LeafLMapWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
 _create: function() {
        var core;
        var self = this;		
        var element = this.element;
        
        core = $(this.options.core).data('cow');
		this.core=core;
        core.bind("dbloaded", {widget: self}, self._onLoaded);
		core.bind("storeChanged", {widget: self}, self._onLoaded);
		element.delegate('.owner','click', function(){
			var key = $(this).attr('owner');
			self.core.featureStores[0].removeItem(key);
			self.core.trigger('storeChanged');
		});
		
		/* Create the map */
		this.map = L.map('map',{ zoomControl:false}).setView([52.083726,5.111282], 9);//Utrecht
		// create the tile layer with correct attribution
		var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
		var osmlightUrl = 'http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png';
		var osmAttrib='Map data © OpenStreetMap contributors';
		var osm = new L.TileLayer(osmlightUrl, {opacity: 0.3,minZoom: 8, maxZoom: 30, attribution: osmAttrib});
		this.map.addLayer(osm);
		/* Initialize the SVG layer */
		this.map._initPathRoot();
		/* We simply pick up the SVG from the map object */
		this.svg = d3.select("#map").select("svg");
		this.handlers = {
			// Triggers the jQuery events, after the OpenLayers events
			// happened without any further processing
			simple: function(data) {
				core.trigger(data.type);
			}
        };
		this._createLayers(this.map);
		
	
		
		core.map = this.map; //Set global :(
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
	//TODO: dit moet vast mooier kunnen, al die stylen kunnen vast elders
	_createLayers: function(map) {
		var viewlayer = new d3layer("viewlayer",{});
		this.viewLayer = viewlayer;
		core.viewLayer = viewlayer;
		var self = this;
		var editlayer = new d3layer('Features layer',{});
		var mylocationlayer = new d3layer('My location',{});
		this.editLayer = editlayer;
		core.editLayer = editlayer;
		this.mylocationLayer = mylocationlayer;
		core.mylocationLayer = mylocationlayer;
		//this.editLayer.events.register('sketchcomplete',{'self':this,layer:layer},function(evt){core.trigger('sketchcomplete',evt.feature)});
		//this.editLayer.events.register('afterfeaturemodified',{'self':this,layer:layer},function(evt){core.trigger('afterfeaturemodified',evt.feature)});
	}

	});
})(jQuery);



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
		element.delegate('.owner','click', function(){
			var key = $(this).attr('owner');
			self.core.featureStores[0].removeItem(key);
			self.core.trigger('storeChanged');
		});
		
		//openlayers stuff
		this.map = new OpenLayers.Map("map");
		var osmlayer = new OpenLayers.Layer.OSM("OpenStreetMap", null, {
		   transitionEffect: 'resize'
		});
		this.map.addLayer(layer = new OpenLayers.Layer.Stamen("toner-lite", {opacity:0.5}));
		this.map.addLayer(osmlayer);
		//this.map.setCenter(new OpenLayers.LonLat(768708,6849389), 10);//Enschede
		this.map.setCenter(new OpenLayers.LonLat(546467,6862526),10);//Amsterdam
		this.map.addControl(new OpenLayers.Control.LayerSwitcher());
		
		
		
		this.handlers = {
			// Triggers the jQuery events, after the OpenLayers events
			// happened without any further processing
			simple: function(data) {
				var extent = data.object.getExtent();
				core.trigger(data.type, extent);
			}
        };
		this._createLayers(this.map);
		
				
		this.map.events.on({
			scope: this,
			moveend: this.handlers.simple		
		});
		core.map = this.map; //Set global :( TODO: try remove global
		this.controls.select.activate();
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
		var s = new OpenLayers.StyleMap({
			'strokeColor':  '#00397C',
			'fillColor':  '#00397C',
			strokeWidth: 2,
			fillOpacity: 0.05,
			label: "${label}",
			labelAlign: "lb",
			fontColor: '#00397C'
		});
		var viewlayer = new OpenLayers.Layer.Vector('Other views',{styleMap: s});
		
		map.addLayer(viewlayer);
		this.viewLayer = viewlayer;
		core.viewLayer = viewlayer;
		var self = this;
		
		var myLocationStyle = new OpenLayers.Style({
		  pointRadius: 15, 
		  externalGraphic: "${icon}",
		  fillColor: "blue",
		  fillOpacity: 1, 
		  strokeColor: "blue",
		  label: "${owner}",
		  labelAlign: "lb",
		  labelXOffset: "15",
          labelYOffset: "0",
		  fontColor: '#00397C'
		}); 
		var myLocationStyleMap = new OpenLayers.StyleMap(myLocationStyle);
		var context = {
			getStrokeWidth: function(feature) {
				if (feature.layer && feature.layer.map.getZoom() > 15)
					return 3;
				return 1;
			},
			getLabel: function(feature) {
				if (feature.attributes.name && feature.layer.map.getZoom() > 13)
                    return feature.attributes.name;
                return "";
			},
            getIcon: function(feature) {
            	if (feature.attributes.icon && feature.attributes.icon != null){
            		//addition for larger scale icons IMOOV
            		str = feature.attributes.icon;
            		var patt=new RegExp("imoov");
            		if (str && feature.layer && feature.layer.map.zoom < 15 && patt.test(str))
            		{
            			return str.replace(/-g.png/g,'k.png');
            		}
                    return feature.attributes.icon;
                }
                return "./mapicons/notvisited.png";
            },
            getLineColor: function(feature){
            	if (feature.attributes.linecolor)
            		return feature.attributes.linecolor;
            	return "black";
            },
            getPolyColor: function(feature){
            	if (feature.attributes.polycolor)
            		return feature.attributes.polycolor;
            	return null;
            },
            getFillOpacity: function(feature){
            	if (feature.geometry && feature.geometry.CLASS_NAME == 'OpenLayers.Geometry.Polygon')
            		return 0.5;
            	return 1;
            },
            getZindex: function(feature){
            	if (feature.geometry && feature.geometry.CLASS_NAME == 'OpenLayers.Geometry.Polygon')
            		return 0;
            	if (feature.geometry && feature.geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString')
            		return 10;
            	return 20;
            }
        };
        
		var template = {
		  pointRadius: 20,
		  strokeWidth: "${getStrokeWidth}",
		  label: "${getLabel}",
		  title: "${getLabel}",
		  labelAlign: "tl",
		  labelXOffset: "15",
          labelYOffset: "0",
		  fontColor: '#00397C',
		  fontSize: '12pt',
		  labelOutlineColor: "white", 
          labelOutlineWidth: 1,
		  graphicZIndex: "${getZindex}",
		  fillOpacity: "${getFillOpacity}",
		  externalGraphic: "${getIcon}",
		  fillColor: "${getPolyColor}",
		  strokeColor: "${getLineColor}"
        };
        var selecttemplate = {
          pointRadius: 40,
		  strokeWidth:6,
		  graphicZIndex: "${getZindex}",
		  fillOpacity: "${getFillOpacity}",
		  externalGraphic: "${getIcon}",
		  fillColor: "${getPolyColor}",
		  strokeColor: "${getLineColor}"
        };
		var style = new OpenLayers.Style(template,{
        		context: context
        });
        var selectstyle = new OpenLayers.Style(selecttemplate,{
        		context: context
        }); 

		
		var editLayerStylemap = new OpenLayers.StyleMap({
			default:style,
			select: selectstyle 
		});
		var editlayer = new OpenLayers.Layer.Vector('Features layer',{
			
			styleMap:editLayerStylemap,
			// add a special openlayers renderer extension that deals better with markers on touch devices
			renderers: ["SVG"],
			// enable the indexer by setting zIndexing to true
			rendererOptions: {zIndexing: true},
			eventListeners:{
				featureselected:function(evt){
					//TODO TT: This whole system of creating a popup is ugly!
					//create something nicer...
					var feature = evt.feature;
					var name = feature.attributes.name || "";
					var desc = feature.attributes.desc || "";
					var innerHtml = ''
						//+'<input onBlur="">Title<br>'
						//+'<textarea></textarea><br>'
						+ 'You can remove or change this feature using the buttons below<br/>'
						+ 'Label: <input id="titlefld" name="name" value ="'+name+'""><br/>'
						+ 'Description: <br> <textarea id="descfld" name="desc" rows="4" cols="25">'+desc+'</textarea><br/>'
						+ '<button class="popupbutton" id="editButton">edit</button><br>'
						+ '<button class="popupbutton" id="deleteButton"">delete</button>'
						+ '<button class="popupbutton" id="closeButton"">Done</button>';
					var anchor = {'size': new OpenLayers.Size(0,0), 'offset': new OpenLayers.Pixel(100, -100)};
					var popup = new OpenLayers.Popup.Anchored("popup",
						OpenLayers.LonLat.fromString(feature.geometry.getCentroid().toShortString()),
						null,
						innerHtml,
						anchor,
						true,
						null
					);
					popup.autoSize = true;
					popup.maxSize = new OpenLayers.Size(800,1000);
					popup.relativePosition = "br";
					popup.fixedRelativePosition = true;
					feature.popup = popup;
					map.addPopup(popup);
					var titlefld = document.getElementById('titlefld');
					titlefld.addEventListener("blur", self.changeFeature, false);
					var descfld = document.getElementById('descfld');
					descfld.addEventListener("blur", self.changeFeature, false);
					var editbtn = document.getElementById('editButton');
					editbtn.addEventListener("touchstart", self.editfeature, false);
					editbtn.addEventListener("click", self.editfeature, false);
					var deletebtn = document.getElementById('deleteButton');
					deletebtn.addEventListener("touchstart", self.deletefeature, false);
					deletebtn.addEventListener("click", self.deletefeature, false);
					var closebtn = document.getElementById('closeButton');
					closebtn.addEventListener("touchstart", self.closepopup, false);
					closebtn.addEventListener("click", self.closepopup, false);
				},
				featureunselected:function(evt){
					var feature = evt.feature;
					//TODO TT: check first if feature attributes have been changed
					var store = feature.attributes.store || "store1";
					core.getFeaturestoreByName(store).updateLocalFeat(feature);
					map.removePopup(feature.popup);
					//TODO TT: this goes wrong first time... 
					//Uncaught TypeError: Cannot call method 'destroy' of null 
					feature.popup.destroy();
					feature.popup = null;
					self.controls.modify.deactivate();
					self.controls.select.activate();
				}
		}});
		var mylocationlayer = new OpenLayers.Layer.Vector('My location',{styleMap:myLocationStyleMap});
		
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
		/*this.editLayer.events.on({
			scope: this,
			sketchcomplete: this.handlers.includeFeature//this.handlers.simple		
		})*/;		
		this.editLayer.events.register('sketchcomplete',{'self':this,layer:layer},function(evt){core.trigger('sketchcomplete',evt.feature)});
		this.editLayer.events.register('afterfeaturemodified',{'self':this,layer:layer},function(evt){core.trigger('afterfeaturemodified',evt.feature)});
		//this.editLayer.events.on({'featureselected': function(){
		//		alert('Feat selected');
		//}});
		this.controls.select.activate();
	},
	_onSketchComplete: function(evt, feature){
		var core = evt.data.widget.core;
		//Disable the draw control(s) after drawing a feature
		var controls = core.map.getControlsByClass('OpenLayers.Control.DrawFeature');
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



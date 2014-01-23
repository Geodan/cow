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
#cow.OlMapWidget

The OpenLayers Mapwidget provides an OpenLayers map including layers that interact
with the features in COW.

Listeners:
core.peerStoreChanged -> redraw peer information (labels, position, extent)
core.storeChanged (something in the featurestore changed) -> redraw complete featurelayer
core.layoutChanged (screenlayout changed) -> reset the map size (needed for extent calculations)
core.zoomToPeersviewRequest (request for zooming to peerextent) -> zoom to extent of peer

**/



(function($) {

var _defaultOptions = {
        bbox: [-180, -85, 180, 85],
        bboxMax: [-180, -85, 180, 85],
        center: [0, 0],
        // The cow.core instance
        core: undefined
};

//global map vars
var geojson_format = new OpenLayers.Format.GeoJSON({
    'internalProjection': new OpenLayers.Projection("EPSG:900913"),
    'externalProjection': new OpenLayers.Projection("EPSG:4326")
});

$.widget("cow.OlMapWidget", {
	options: $.extend({}, _defaultOptions),
	
 	_create: function() {
        var core;
        var self = this;		
        var element = this.element;
        this._d3layers = [];
        core = $(this.options.core).data('cow');
		this.core=core;

		core.bind("storeChanged", {widget: self}, self._onFeatureStoreChanged);
		core.bind("peerStoreChanged", {widget: self}, self._onPeerStoreChanged);
		core.bind("projectListChanged",  {widget: self}, self._onPeerStoreChanged);
		core.bind("layoutChanged", {widget: self},self._updateSize);
		core.bind("zoomToExtent", {widget: self},self._zoomToPeersView);
		core.bind("zoomToPoint", {widget: self},self._zoomToPeersLocation);
		core.bind("myPositionChanged",{widget: self},self._onPeerStoreChanged);
		
		//openlayers stuff
		this.map = new OpenLayers.Map("map",{
		});

		var osmlayer = new OpenLayers.Layer.OSM("OpenStreetMap", null, {
		   transitionEffect: 'resize'
		});
		
		//this.map.addLayer(layer = new OpenLayers.Layer.Stamen("toner-lite", {opacity:0.5}));
		this.map.addLayer(osmlayer);
		//this.map.setCenter(new OpenLayers.LonLat(768708,6849389), 10);//Enschede
		this.map.setCenter(new OpenLayers.LonLat(546467,6862526),15);//Amsterdam
		//this.map.addControl(new OpenLayers.Control.LayerSwitcher());
		
		
		var handleOnLoad = function(){
		    var extent = self.map.getExtent().toGeometry();
            var toproj = new OpenLayers.Projection("EPSG:4326");
            var fromproj = new OpenLayers.Projection("EPSG:900913");
            extent.transform(fromproj, toproj);
            var bounds = extent.getBounds();
            var extent = { //Changing openlayers extent into json feat
					left: bounds.left,
					bottom: bounds.bottom,
					right: bounds.right,
					top: bounds.top
			};
            self.core.me() && self.core.me().view({extent:extent}); //Set my own extent
            //Reset/redraw layers
            self._d3layers.forEach(function(l){
                    l.reset();
            });
		};
		
		var handleNewExtent = function(data){
            var extent = data.object.getExtent().toGeometry();
            var toproj = new OpenLayers.Projection("EPSG:4326");
            var fromproj = new OpenLayers.Projection("EPSG:900913");
            extent.transform(fromproj, toproj);
            var bounds = extent.getBounds();
            var extent = { //Changing openlayers extent into json feat
					left: bounds.left,
					bottom: bounds.bottom,
					right: bounds.right,
					top: bounds.top
			};
            self.core.me() && self.core.me().view({"extent":extent}); //Set my own extent
            //Reset/redraw layers
            self._d3layers.forEach(function(l){
                    l.reset();
            });
            
        };
		this._createLayers();
		handleOnLoad();
				
		this.map.events.on({
			scope: this,
			moveend: handleNewExtent		
		});
		this.controls.select.activate();
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
	_onFeatureStoreChanged: function(evt) {
		//console.log('_onFeatureStoreChanged');
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
		return this.map.getExtent().toBBOX();
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
        var lb = new OpenLayers.LonLat(bbox.left,bbox.bottom);
        var rt = new OpenLayers.LonLat(bbox.right,bbox.top);
        var fromproj = new OpenLayers.Projection("EPSG:4326");
        var toproj = new OpenLayers.Projection("EPSG:900913");
        lb.transform(fromproj, toproj);
        rt.transform(fromproj, toproj);
        self.map.zoomToExtent([lb.lon,lb.lat,rt.lon,rt.lat]);
	},
	_zoomToPeersLocation: function(evt, location){
	    var self = evt.data.widget;
	    var loc = new OpenLayers.LonLat(location.longitude,location.latitude);
	    var fromproj = new OpenLayers.Projection("EPSG:4326");
        var toproj = new OpenLayers.Projection("EPSG:900913");
        loc.transform(fromproj, toproj);
	    self.map.setCenter(loc,14,false,false); //Weird OL behaviour. Setting 'dragging' to false triggers moved event.
	},
	_updateSize: function(evt){
	    var map = evt.data.widget.map;
	    map.updateSize(map);
	},
	
	_reloadLayer: function(e){
		self.core.editLayer.removeAllFeatures();
		var items = self.core.featurestore().featureItems();
		$.each(items, function(i, object){
			var feature = geojson_format.read(object.options.feature,"Feature");
			feature.properties = {};
			$.each(feature.attributes, function(i,d){
				feature.properties[i] = d;
			})
			
			if (object.options.status != 'deleted'){
				self.core.editLayer.addFeatures(feature);
			}
		});
	},
	
	_createLayers: function(map) {
		var self = this;
		var map = self.map;
		/** Here comes the big bad editlayer.. **/
		var context = {
			getStrokeWidth: function(feature) {
				if (feature.layer && feature.layer.map.getZoom() > 15)
					return 3;
				return 1;
			},
			getLabel: function(feature) {
				if (feature.properties && feature.properties.name && feature.layer.map.getZoom() > 13)
                    return feature.properties.name;
                return "";
			},
            getIcon: function(feature) {
            	if (feature.properties && feature.properties.icon && feature.properties.icon != null){
            		//addition for larger scale icons IMOOV
            		str = feature.properties.icon;
            		var patt=new RegExp("imoov");
            		if (str && feature.layer && feature.layer.map.zoom < 15 && patt.test(str))
            		{
            			return str.replace(/-g.png/g,'k.png');
            		}
                    return feature.properties.icon;
                }
                return "./mapicons/notvisited.png";
            },
            getLineColor: function(feature){
            	if (feature.properties && feature.properties.linecolor)
            		return feature.properties.linecolor;
            	return "black";
            },
            getPolyColor: function(feature){
            	if (feature.properties && feature.properties.polycolor)
            		return feature.properties.polycolor;
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
						+ '<button class="popupbutton" id="closeButton"">' + translator.translate('Done')+'</button>';
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
					//var titlefld = document.getElementById('titlefld');
					//titlefld.addEventListener("blur", self.changeFeature, false);
					//var descfld = document.getElementById('descfld');
					//descfld.addEventListener("blur", self.changeFeature, false);
					var editbtn = document.getElementById('editButton');
					editbtn.addEventListener("touchstart",self.editfeature, false);
					editbtn.addEventListener("click",self.editfeature, false);
					var deletebtn = document.getElementById('deleteButton');
					deletebtn.addEventListener("touchstart", self.deletefeature, false);
					deletebtn.addEventListener("click", self.deletefeature, false);
					var closebtn = document.getElementById('closeButton');
					closebtn.addEventListener("touchstart", self.savefeature, false);
					closebtn.addEventListener("click", self.savefeature, false);
				},
				featureunselected:function(evt){
					if (evt.feature.popup){
						self.map.removePopup(evt.feature.popup);
					}
					
				}
		}});
		
		
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
		this.editLayer = editlayer;
		core.editLayer = editlayer;
		/*this.editLayer.events.on({
			scope: this,
			sketchcomplete: this.handlers.includeFeature//this.handlers.simple		
		})*/;		
		this.editLayer.events.register('sketchcomplete',
			{'self':this,layer:editlayer},
			function(evt){
				//Disable the draw control(s) after drawing a feature
				$.each(self.controls,function(id,control){
						control.deactivate();
				});
				self.controls.select.activate();
				
				var feature = JSON.parse(geojson_format.write(evt.feature));
				var item = {};
				var d = new Date();
                var timestamp = d.getTime();
                feature.properties.icon = self.core.current_icon; //TODO TT: not nice
                feature.properties.linecolor = self.core.current_linecolor;
                feature.properties.fillcolor = self.core.current_fillcolor;
                feature.properties.polycolor = self.core.current_polycolor;
                item.key = self.core.UID + "#" + timestamp;
                feature.properties.key = item.key;
                feature.properties.store = self.core.activeproject();
                feature.properties.creator = self.core.username();
                feature.properties.owner = self.core.username();
                item.uid = self.core.UID;
                item.created = timestamp;
                item.updated = timestamp;
                
                item.status = '';
                item.feature = feature;
				core.featurestore().featureItems({data: item, source: 'user'});
				//core.featurestore().saveLocalFeat(feature);
				evt.feature.destroy(); //Ridiculous.... without this the 'edited' feature stays on the map
			}
		);
		this.editLayer.events.register('afterfeaturemodified',
			{'self':this,layer:editlayer},
			function(evt){
				var feature = JSON.parse(geojson_format.write(evt.feature));
				//core.featurestore().updateLocalFeat(feature);
				//First transform into featurestore item
				var item = core.featurestore().getFeatureItemById(feature.properties.key);
				var d = new Date();
				var timestamp = d.getTime();
				item.feature = feature;
				item.updated = timestamp;
				core.featurestore().featureItems({data:item, source: 'user'});
				
				self.controls.modify.deactivate();
				self.controls.select.activate();
				
			}
		);
		
		self.controls.select.activate();
		/** End of the big bad editlayer **/
		
		
		
		var myd3layer = new OpenLayers.Layer.Vector('Extents layer');
		// Add the container when the overlay is added to the map.
		myd3layer.afterAdd = function () {
			var divid = myd3layer.div.id;
			var viewlyr = new d3layer("viewlayer",{
				maptype: "OpenLayers",
				divid:divid,
				map: self.map,
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
		};
		map.addLayer(myd3layer);
		tmp = this;//FOR DEBUG
		
		var myLocationLayer = new OpenLayers.Layer.Vector('d3layer');
		myLocationLayer.afterAdd = function () {
			var divid = myLocationLayer.div.id;
			var locationlyr = new d3layer("locationlayer",{
				maptype: "OpenLayers",
				divid:divid,
				map: self.map,
				type: "circle",
				coolcircles: true,
				satellites: false,
				labels: true,
				labelconfig: {
					field:"owner",
					style: {
					    stroke: "steelBlue"
					}
				},
				style: {
					fill: "grey",
					stroke: "steelBlue",
				}
			});
			self.d3Layers(locationlyr);
		};
		map.addLayer(myLocationLayer);
		
		//var vecLyr = map.getLayersByName('d3layer')[0];
		//map.raiseLayer(vecLyr, map.layers.length);
		//map.resetLayersZIndex();
		
	},
	
		
	
	
	editfeature: function(evt,x){ //First set the text and then go to edit mode without writing to store first
		var feature = core.editLayer.selectedFeatures[0];
		feature.attributes.name = document.getElementById('titlefld').value; //TODO. Yuck, yuck yuck....
		feature.attributes.desc = document.getElementById('descfld').value;
		feature.attributes.owner = self.core.me().owner().name;
		if (feature.popup) 
			feature.popup.destroy();
		var controls = $('#map').OlMapWidget('getControls');//TODO: give self along with event so we can reach controls
		controls.modify.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
		controls.modify.standalone = true;
		controls.modify.selectFeature(feature);
		controls.modify.activate();
	},
	deletefeature: function(){
		var feature = core.editLayer.selectedFeatures[0];
		if (feature.popup)
			feature.popup.destroy();
		var key = feature.properties.key;
		if (core.activeproject() == feature.properties.store){
		    core.featurestore().removeFeatureItem(key);
		    core.trigger('storeChanged');
		}
	},
	savefeature: function(evt){ //Just save the text...
	    var popupkey = document.getElementById('popupid').value;
		//var feature = core.editLayer.selectedFeatures[0];
		var feature;
		core.editLayer.features.forEach(function(f){
		        if (f.data && f.data.key == popupkey){
		            feature = f;
		        }
		});
		if (feature){
            feature.attributes.name = document.getElementById('titlefld').value; //TODO. Yuck, yuck yuck....
            feature.attributes.desc = document.getElementById('descfld').value;
            feature.attributes.owner = self.core.me().owner().name;
            if (feature.popup){
                //core.map.removePopup(feature.popup);
                feature.popup.destroy(); //we have to destroy since the next line triggers a reload of all features
                feature.popup = null;
            }
            var jsonfeature = JSON.parse(geojson_format.write(feature));//TODO is this needed?
            if (core.activeproject() == feature.properties.store){
                //core.featurestore().updateLocalFeat(jsonfeature);
                var item = core.featurestore().getFeatureItemById(feature.properties.key);
                var d = new Date();
                var timestamp = d.getTime();
                item.feature = jsonfeature;
                item.updated = timestamp;
                core.featurestore().featureItems({data:item, source: 'user'});
            }
        }
	}

	});
})(jQuery);



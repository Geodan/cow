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
        
        
        
        //Create the OL map
		this.map = new OpenLayers.Map("map");
		var osmlayer = new OpenLayers.Layer.OSM("OpenStreetMap", null, {
		   transitionEffect: 'resize'
		});
		this.map.addLayer(osmlayer);
		this.map.setCenter(new OpenLayers.LonLat(546467,6862526),10);//Amsterdam
		this.map.addControl(new OpenLayers.Control.LayerSwitcher());
		
		//Add the D3 Layers
		var myd3layer = new OpenLayers.Layer.Vector('Extents layer');
		
		myd3layer.afterAdd = function () {
			var divid = myd3layer.div.id;
			self.viewlyr = new d3layer("viewlayer",{
				maptype: "OpenLayers",
				divid:divid,
				map: self.map,
				type: "path",
				labels: true,
				labelconfig: {
					field: "owner"
				},
				style: {
					fill: "none",
					stroke: "steelBlue",
					'stroke-width': 2
				}
			});
		};
		this.map.addLayer(myd3layer);
        
		var myLocationLayer = new OpenLayers.Layer.Vector('d3layer');
		myLocationLayer.afterAdd = function () {
			var divid = myLocationLayer.div.id;
			self.locationlyr = new d3layer("locationlayer",{
				maptype: "OpenLayers",
				divid:divid,
				map: self.map,
				type: "circle",
				labels: true,
				labelconfig: {
					field:"owner"
				},
				style: {
					fill: "steelBlue"
				}
			});
		};
		map.addLayer(myLocationLayer);
		

		//Add the editlayer (and styles)		
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
					var name = feature.properties.name || "";
					var desc = feature.properties.desc || "";
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
					var feature = JSON.parse(geojson_format.write(evt.feature));
					//TODO TT: check first if feature properties have been changed
					var store = feature.properties.store || "store1";
					//core.getFeaturestoreByName(store).updateLocalFeat(feature);
					if (evt.feature.popup){
						self.map.removePopup(evt.feature.popup);
						//TODO TT: this goes wrong first time... 
						//Uncaught TypeError: Cannot call method 'destroy' of null 
						evt.feature.popup.destroy();
						evt.feature.popup = null;
					}
					self.controls.modify.deactivate();
					self.controls.select.activate();
				}
		}});
		this.map.addLayer(editlayer);

		//Add the controls		
		this.controls = {
			modify: new OpenLayers.Control.ModifyFeature(editlayer),
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
		
		this.controls.select.activate();
		
		
 	} //End of _create
 	
 	
 	
 	
});

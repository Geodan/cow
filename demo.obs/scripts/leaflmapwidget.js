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
			
		})
		//.setView([52.083726,5.111282], 9);//Utrecht
		//.setView([52.341921,4.912838], 17);//Geodan Adam
		.setView([51.890054,5.094695],12);//Leerdam
		
		// add an OpenStreetMap tile layer
		var osmLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		});
		// add Dutch AHN layer
		var ahnUrl = "http://t3.edugis.nl/tiles/tilecache.py?map=maps/edugis/cache/hoogte.map";
		var ahnLayer = L.tileLayer.wms(ahnUrl, {
            layers: 'hoogtes',
            format: 'image/png',
            transparent: true
        });
        // Add a darker themd OSM layer
		var tileUrl = 'http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png';
		var osmDarkLayer = L.tileLayer(tileUrl, {
            attribution: 'Background map design by <a href="http://www.stamen.com/">Stamen</a>. Tiles hosted by <a href="http://www.geoiq.com/">GeoIQ</a>. Map data: <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors and <a href="http://www.naturalearthdata.org/">Natural Earth Data</a>.',
            subdomains: '0123',
            minZoom: 2,
            maxZoom: 18
        }).addTo(this.map);
		
		//Layer controls
		var baseLayers = {"Open Street Map": osmLayer, "Open Street Map (achtergrond)": osmDarkLayer, "Hoogtekaart": ahnLayer};
		this.layercontrol = new L.control.layers(baseLayers).setPosition("bottomleft").addTo(this.map);
		L.Control.measureControl({position: "bottomleft"}).addTo(this.map);
		//L.Control.Zoom({position: "bottomleft"}).addTo(this.map);
		
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
				$.each(self._d3layers, function(i,l){
                    l.reset(e);
                });
		};
		this._createLayers(this.map);
		handleOnLoad();
				
		this.map.on('moveend',function(e){
				handleNewExtent(e);
				d3.selectAll('.popup').remove();//Remove all popups on map
		});
		this.map.on("viewreset", function(e){
		        //handleNewExtent(e);
		});
		this.map.on('click',function(e){
		    d3.selectAll('.popup').remove();//Remove all popups on map
            self.controls.editcontrol.save();
            self.controls.editcontrol.disable();
            self.editLayer.clearLayers();
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
        var self = this;
        //TODO: what a weird method the get the layer. Can't be done easier?
        var returnlayer;
        $.each(self._d3layers,function(i,layer){
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
	    if (self.extentlyr){
			self.extentlyr.data(extentCollection);
		}
		//Update layer with locations
		if (self.getD3LayerByName('extentlayer')){
			self.getD3LayerByName('extentlayer').data(extentCollection);
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
		
		var items = self.core.itemstore().items('feature');
		var collection = {"type":"FeatureCollection","features":[]};
		var viewcollection = {"type":"FeatureCollection","features":[]};
		$.each(items, function(i, item){
		    var mygroups = self.core.project.myGroups();
			var feature = item.data();
            if(feature === undefined) {
                console.warn('old item type');
                return false;
            }
            else{
                var opacity = 1;
                feature.id = feature.properties.key;
                //Filter on 'gedeeld beeld'
                //if gedeeld beeld:
                if ($('#chk-gedeeld').prop('checked')){
                    //if item is editable by me
                    if (item.status() != 'deleted'
                        && (item.permissionHasGroup('edit',mygroups) || item.permissionHasGroup('view',mygroups)) //Filter on editable/viewable feats
                        ){
                        //if item is viewable by *all* selected groups and me
                        //check for all selected groups
                        var bright = true;
                        $('.other').each(function(i,d){
                            var groupid = $(this).attr('value');
                            var checked = $(this).prop('checked');
                            if (checked && !item.permissionHasGroup('view',groupid))
                                bright = false;
                        });
                        //check for my group(s)
                        if (!item.permissionHasGroup('view',self.core.project.myGroups()))
                                bright = false;
                        if (bright){
                            //Show bright
                            opacity = 1;
                        }
                        //if item is not viewable *all* selected groups
                        else{
                            //Show dimmed
                            opacity = 0.1;
                        }
                 }
                 //else do not show
                 else{
                     opacity = 0; //Trick the if statement in not null
                 }
              }
              //else do normal flow
                
                
                feature.style = {
                    icon: feature.properties.icon,
                    stroke: feature.properties.linecolor,
                    fill:  feature.properties.polycolor,
                    "fill-opacity": 0.5,
                    //"fill-opacity": opacity,
                    opacity: opacity
                }
                //Workaround for lines with a fill
                if (feature.geometry.type == 'LineString')
                    feature.style.fill = 'none';
                    
                
                
                if (item.status() != 'deleted' && opacity > 0
                    && item.permissionHasGroup('edit',mygroups) //Filter on editable feats
                ){
                    collection.features.push(feature);
                    //self.editLayer.addData(feature)
                    //	.setStyle(self.layerstyle);
                }
                else if (item.status() != 'deleted' && opacity > 0
                    && item.permissionHasGroup('view',mygroups) //Filter remaining feats on viewable feats
                ){
                    viewcollection.features.push(feature);
                } 
			}
		});
		self.getD3LayerByName('editlayer').data(collection);
		self.getD3LayerByName('viewlayer').data(viewcollection);
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
			else{
			    layer.setStyle({
					opacity: 0.5,
					fillOpacity: 0.5
				})
			}
		}
		function resetHighlight(e) {
			self.editLayer.resetStyle(e.target);
		}
		function zoomToFeature(e) {
			self.map.fitBounds(e.target.getBounds());
		}
		
		
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
                            iconSize: [40, 44],
                            opacity: 0.5,
                            fillOpacity: 0.5
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
		L.drawLocal.edit.handlers.edit.tooltip.subtext = '';



		this.map.addControl(this.drawControl);
		
		this.map.on("draw:edited", function(e,x){
				var layers = e.layers;
				
				layers.eachLayer(function (layer) {
				    var feature = layer.toGeoJSON()
				    //First transform into featurestore item
                    var item = core.itemstore().getItemById(feature.properties.key);
                    item.data(feature);
                    //item.changer(self.core.UID);
                    var newitem = core.itemstore().items('feature',{data:item.flatten()},'user');
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
            var item = self.core.itemstore().items('feature',{data: item}, 'user');
            item.permissions('view',self.core.project.myGroups());//Set default permissions to my groups
            item.permissions('edit',self.core.project.myGroups());//Set default permissions to my groups
            item.permissions('share',self.core.project.myGroups());//Set default permissions to my groups
            //TODO: 2x submitting an item is not the proper way to do permissions
            var item = self.core.itemstore().items('feature',{data: item.flatten()}, 'user'); 
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
			core.current_polycolor = 'none';
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
		
		/** End of the big bad editlayer **/
		/* Obsolete by D3 methods
		var editPopup = function(d){
		    var feature = d;
		    var key = feature.properties.key || "";
            var name = feature.properties.name || "";
            var desc = feature.properties.desc || "";
            var creator = feature.properties.creator || "unknown";
            var owner = feature.properties.owner || "unknown";
            var item = self.core.itemstore().getItemById(key);
            
            var groups = self.core.project.groups();
            var groupsChooser = '<table id="groupsChooser"><tr><th>group</th><th>vw</th><th>ed</th><th>sh</th></tr>';
            $.each(groups,function(i,d){
                    //TODO: functionality to add permissions to this feature
                    //Remark: a user can always edit his own feature
                    var canedit = item.permissionHasGroup('edit',d._id.toString());
                    var canview = item.permissionHasGroup('view',d._id.toString());
                    var canshare = item.permissionHasGroup('share',d._id.toString());
                    groupsChooser = groupsChooser + '<tr><td class="group" group="'+d._id+'">'+d.name+'</td><td class='+canview+' >'+canview+'</td><td class='+canedit+' >'+canedit+'</td><td class='+canshare+' >'+canshare+'</td></tr>';
            });
            groupsChooser = groupsChooser + '</table>';
		    var innerHtml = ''
                    //+'<input onBlur="">Title<br>'
                    //+'<textarea></textarea><br>'
                    //+ 'You can remove or change this feature using the buttons below<br/>'
                    + '<input id="popupid" type="hidden" name="popupid" value ="'+key+'"">'
                    + translator.translate('Label') + ': <input id="titlefld" name="name" value ="'+name+'""><br/>'
                    + translator.translate('Description') + ': <br> <textarea id="descfld" name="desc" rows="4" cols="25">'+desc+'</textarea><br/>'
                    + groupsChooser + '<br>'
                    + '<small>' + translator.translate('Created_by') + ': <i>'+ creator + '</i></small><br>'
                    + '<small>' + translator.translate('Last_edit_by') + ': <i>'+ owner + '</i></small><br>'
                    + '<button class="popupbutton" id="editButton">' + translator.translate('edit')+'</button><br>'
                    + '<button class="popupbutton" id="deleteButton"">' + translator.translate('delete')+'</button>'
                    + '<button class="popupbutton" id="closeButton"">' + translator.translate('Done')+'</button>'
                    + '<button class="popupbutton" id="routeButton"">' + translator.translate('Route')+'</button>';
            $('#featurepopup').html(innerHtml);
            
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
		*/

        var d3viewlyr = new d3layer("viewlayer",{
		    maptype: "Leaflet",
			map: self,
			//onClick: editPopup,
			type: "path",
			onMouseover: cow.textbox,
			coolCircles: true,
			labels: true,
			labelconfig: {
                field: "desc",
                style: {
                    stroke: "steelBlue",
                    //opacity: 0.5
                }
            },
			style: {
					fill: "none",
					stroke: "steelBlue",
					'stroke-width': 2,
					//opacity: 0.5
				}
		});
        self.d3Layers(d3viewlyr);
        
		
        /* D3 Editlayer */
		var d3editlyr = new d3layer("editlayer",{
		    maptype: "Leaflet",
			map: self,
			//onClick: editPopup,
			type: "path",
			onClick: cow.menu,
			onMouseover: cow.textbox,
			labels: true,
			labelconfig: {
                field: "desc",
                style: {
                    stroke: "#000033"
                    //stroke: "steelBlue"
                }
            },
			style: {
					fill: "none",
					stroke: "steelBlue",
					'stroke-width': 4
					
				}
		});
        self.d3Layers(d3editlyr);
        
        
        
		var extentlyr = new d3layer("extentlayer",{
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
        self.d3Layers(extentlyr);
        
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
        
        var data = [];
        /* Floodlayer */
        var floodlayer = new L.geoJson(data, {
            style: function (feature) {
                var style = {};
                if (feature.properties.tijdstip == 'na 4 uur'){
                    style.opacity  = 0.2;
                }
                else if (feature.properties.tijdstip == 'na 8 uur'){
                    style.opacity  = 0.4;
                }
                else if (feature.properties.tijdstip == 'na 12 uur'){
                    style.opacity  = 0.6;
                }
                else if (feature.properties.tijdstip == 'na 16 uur'){
                    style.opacity  = 0.8;
                }
                //style.fillOpacity = 0;
                style.fillColor = "None";
                return style;
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.tijdstip);
            }
        }).addTo(map);
        self.layercontrol.addOverlay(floodlayer,"Inundatie");
        d3.json('./data/flood_merged.geojson',function(data){
               var collection = {"type":"FeatureCollection","features":[]};
                collection.features = data.features;
                floodlayer.addData(collection);
        });
        /*Kwetsbare objecten*/
        var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
        var kwetsbareobjectenlayer = new L.geoJson(data, {
            pointToLayer: function(feature, latlng){
                return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            style: function (feature) {
                if (feature.properties.PRIORITEIT == 1){
                    return {fillColor: 'red'}
                }
                else if (feature.properties.PRIORITEIT == 2){
                    return {fillColor: 'orange'}
                }
                else if (feature.properties.PRIORITEIT == 3){
                    return {fillColor: 'yellow'}
                }
                else if (feature.properties.PRIORITEIT == 4){
                    return {fillColor: 'blue'}
                }
                else{
                    return {fillColor: 'blue'}
                }
            },
            onEachFeature: function (feature, layer) {
                layer.bindPopup(feature.properties.ROT_NAAM + "<br>" + feature.properties.OMSCHRI5);
            }
        });
        self.layercontrol.addOverlay(kwetsbareobjectenlayer,"Kwetsbare objecten");
        d3.json('./data/kwetsbareobjecten.geojson',function(data){
               var collection = {"type":"FeatureCollection","features":[]};
                collection.features = data.features;
                kwetsbareobjectenlayer.addData(collection);
        });
        /* Opvanglocaties */
        var opvanglocatieslayer = new L.geoJson(data, {
            style: function (feature) {
                return {color: 'red',weight: 1}
            },
            onEachFeature: function (feature, layer) {
                layer.bindLabel(feature.properties.gebruiksdoelverblijfsobject,{ noHide: true });
                layer.bindPopup(feature.properties.gebruiksdoelverblijfsobject);
            }
        });
        self.layercontrol.addOverlay(opvanglocatieslayer,"Openbare functies");
        d3.json('./data/publieke_functie.geojson',function(data){
               var collection = {"type":"FeatureCollection","features":[]};
                collection.features = data.features;
                opvanglocatieslayer.addData(collection);
        });
        
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
        //feature.properties.name = document.getElementById('titlefld').value; //TODO. Yuck, yuck yuck....
        feature.properties.desc = document.getElementById('descfld').value;
        feature.properties.owner = self.core.username();
        self.map.closePopup(); //we have to destroy since the next line triggers a reload of all features
		if (self.core.activeproject() == feature.properties.store){
		    //core.featurestore().updateLocalFeat(feature);
            var item = core.itemstore().getItemById(feature.properties.key);
            item.data(feature);
            self.core.itemstore().items('feature',{data:item.flatten()}, 'user');
        }
        //self.editLayer.clearLayers();
	},
	closepopup: function(self){
	    $('#featurepopup').html('');//TODO
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



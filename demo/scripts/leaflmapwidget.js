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
		});
		
		var osmDarkLayer = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-hillshading/{z}/{x}/{y}.png', {
            attribution: 'Background map design by <a href="http://www.stamen.com/">Stamen</a>. Tiles hosted by <a href="http://www.geoiq.com/">GeoIQ</a>. Map data: <a href="http://www.openstreetmap.org/">OpenStreetMap</a> contributors and <a href="http://www.naturalearthdata.org/">Natural Earth Data</a>.',
            subdomains: '0123',
            minZoom: 2,
            maxZoom: 18
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
				$.each(self._d3layers, function(i,l){
                    l.reset(e);
                });
		};
		this._createLayers(this.map);
		handleOnLoad();
				
		this.map.on('moveend',function(e){
				handleNewExtent(e);
				d3.selectAll('.pie').remove();
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
		var items = self.core.itemstore().items('feature');
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
                var mygroups = self.core.project.myGroups();
                if (item.status() != 'deleted'
                    && item.permissionHasGroup('edit',mygroups)
                ){
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
									iconSize: [20, 22],
									opacity: 0.5,
									fillOpacity: 0.5
							})
					})//.bindLabel(feature.properties.name,{noHide: true})
					;
				}
		}
		).addTo(this.map);
		tmp = editlayer;
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
            item.permissions('edit',self.core.project.myGroups());
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
		//Replacing editpopup:
		var menu = function(feature,obj){
		    var _this = this;
		    d3.selectAll('.pie').remove(); //Remove any old menu's
		    var loc = d3.mouse(obj); //Wrong on firefox
		    var divloc = [d3.event.screenX ,d3.event.screenY ];
		    var item = self.core.itemstore().getItemById(feature.properties.key);
		    var groups = self.core.project.groups();
		    $.each(groups, function(i,d){
		        d.children = [{name: 'Vw'},{name: 'Ed'},{name: 'Sh'}]
		    });
		    var data = {
             "name": "root",
             "children": [
              //{
              // "name": "P",
              // value: 5,
              // "children": groups
              //},
              {
                  "name": "E",
                  icon: './css/img/pencil_icon.png',
                  label: 'Bewerken',
                  value: 1
             },{
                  "name": "D",
                  icon: './css/img/clipboard_cut_icon.png',
                  label: 'Verwijderen',
                  value: 1
             },{
                  "name": "T",
                  icon: './css/img/text_letter_t_icon.png',
                  label: "Tekst",
                  size: 1
             },{
                  "name": "S",
                  icon: './css/img/share_2_icon.png',
                  label: "Delen",
                  size: 1
             }]
            };
            if (feature.geometry.type == 'Polygon'){
                data.children.push({
                  "name": "Pop",
                  icon: './css/img/users_icon.png',
                  label: "Populatie",
                  size: 1
                })
            }
                
            var width = 150;
            var height = 150;
            var radius = Math.min(width, height) / 2;
            var partition = d3.layout.partition()
                .sort(null)
                .size([2 * Math.PI, radius * radius])
                .value(function(d) { return d.value || 1; });
            var arc = d3.svg.arc()
                .startAngle(function(d) { return d.x; })
                .endAngle(function(d) { return d.x + d.dx; })
                .innerRadius(function(d) { return Math.sqrt(d.y * 0.7); })
                .outerRadius(function(d) {
                    return Math.sqrt((d.y + d.dy)*1.5);
            });
		    
            var color = d3.scale.category10();
            var entity = _this.g.append('g');

           if (entity.attr('selected') == 'true'){
            entity.select('.pie').remove();
            entity.attr('selected','false');
           }
           else {
            entity.attr('selected','true');
            
            var chart = entity.append('g')
                .classed('pie',true)
                .attr('width',width)
                .attr('height',height)
                .append('g')
                .attr('class','zoomable')
                .attr("transform", function(z){
                    var x = loc[0];
                    var y = loc[1];
                    return "translate(" + x + "," + y + ")"
                });
             
             //var g = chart.selectAll('.arc1')
             var g = chart.datum(data).selectAll("arc1")
                .data(partition.nodes)
                .enter().append("g")
                .attr("class", "arc1")
                .on('click', function(d){
                     d3.event.stopPropagation();//Prevent the map from firing click event as well
                     var name = d.name;
                     if (name == 'Pop'){
                         window.callback = function(d){
                             console.log(d);
                         }
                         d3.jsonp('http://model.geodan.nl/cgi-bin/populator/populator.py',function(){console.log(arguments)});
                     }
                     if (name == 'E'){ //edit geometry
                        entity.remove();
                        self.editLayer.addData(feature);
                        self.editfeature(self,feature);
                        
                    }
                    else if (name == 'T'){ //edit tekst
                        entity.remove();
                        var name = feature.properties.name || "";
                        var desc = feature.properties.desc || "";
                        var innerHtml = ''
                        + translator.translate('Label') + ': <input id="titlefld" name="name" value ="'+name+'""><br/>'
                        + translator.translate('Description') + ': <br> <textarea id="descfld" name="desc" rows="4" cols="25">'+desc+'</textarea><br/>'
                        //+ '<button class="popupbutton" id="closeButton"">' + translator.translate('Done')+'</button>'
                        + '';
                        var div = d3.select('body').append('div')
                            .attr("height", 500)
                            .style('left',divloc[0]  -100 +  'px')
                            .style('top',divloc[1] + 0 + 'px')
                            .style('background-color','white')
                            .style('opacity',0.7)
                            .style('position','absolute');
                            div.append('div').attr("width", 480)
                            
                            .html(innerHtml);
                            div.append('div')
                                .html(translator.translate('Done'))
                                .classed('popupbutton', true)
                                .on('click',function(z){
                                        self.changeFeature(self, feature);
                                        div.remove();
                                });
                    }
                    else if (name == 'P'){//Set permissions
                        console.log(d, this);
                        
                    }
                    else if (name == 'D'){//Delete feature
                        entity.remove();
                        self.deletefeature(self,feature);
                    }   
                })
                .on('mouseover', function(d){ //Mouseover menulabel
                    d3.select(this)
                     .style('opacity',0.5)
                     .append("text")
                      .classed('menu',true)
                      //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                      .attr("dy", 0)
                      .attr("dx", 0)
                      .style("text-anchor", "middle")
                      .text(function(d) { 
                              return d.label; 
                      });
                })
                .on('mouseout', function(d){
                    d3.select(this)
                        .style('opacity',1)
                        .selectAll('text').remove();
                });
                
            g.append("path")
                .attr("d", function(d){
                    return arc(d);
                })
                .style("stroke", "#fff")
                .style("fill", function(d) {
                    if (d.name == 'root') 
                        return 'none';
                    else if (d.parent && d.parent.name == 'P')
                        return 'none';
                    else if (d.parent && d.parent.name == 'root')
                        return color(d.name);
                    else 
                        return color(d.name);
                })
                
                
            g.append("svg:image")
                .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
               .attr('x',-9)
               .attr('y',-12)
               .attr('width', 20)
               .attr('height', 24)
               .attr("xlink:href",function(d){
                       return d.icon;
               })
            //g.append("text")
            //  .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
            //  .attr("dy", ".35em")
            //  .style("text-anchor", "middle")
            //  .text(function(d) { 
            //          return d.name; 
            //  });
           }
           
              
              
          }
		
		var d3editlyr = new d3layer("editlayer",{
		    maptype: "Leaflet",
			map: self,
			//onClick: editPopup,
			type: "path",
			onClick:menu,
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
					'stroke-width': 2
					
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



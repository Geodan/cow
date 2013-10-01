var tmp;
function d3layer(layername, config){
		var f = {}, bounds, feature, collection;
		this.f = f;
		var _this = this;        
		var layername = layername;
		f.layername = layername;
		this.data;
		this.type = config.type || "path";
		this.freq = 100;
		this.g = config.g;
		this.map = config.map;
		this.style = config.style;
		this.classfield = config.classfield;
		this.satellites = config.satellites || false;
		this.coolcircles = config.coolcircles || false;
		this.videobox = config.videobox || false;
		this.labels = config.labels || false;
		this.labelconfig = config.labelconfig;
		this.highlight = config.highlight || false;
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		this.bounds = [[0,0],[1,1]];
		var width, height,bottomLeft,topRight;
          
		if (config.maptype == 'OpenLayers'){//Getting the correct OpenLayers SVG. 
			var div = d3.selectAll("#" + config.divid);
			div.attr("z-index",10001);
			div.selectAll("svg").remove();
			var svg = div.append("svg");
		}
		else { //Leaflet does it easier
			/* Initialize the SVG layer */
			this.map.map._initPathRoot()    
			var svg = d3.select("#map").select("svg");
		}
		
		var g = svg.append("g");
            
        // Projecting latlon to screen coordinates
		this.project = function(x) {
		  if (config.maptype == 'Leaflet')
		  	  var point = _this.map.map.latLngToLayerPoint(new L.LatLng(x[1], x[0])); //Leaflet version
		  else if (config.maptype == 'OpenLayers'){
		  	  var loc =  new OpenLayers.LonLat(x[0],x[1]);
		  	  var fromproj = new OpenLayers.Projection("EPSG:4326");
		  	  var toproj = new OpenLayers.Projection("EPSG:900913");
		  	  loc.transform(fromproj, toproj);
		  	  var point = _this.map.getViewPortPxFromLonLat(loc); //OpenLayers version
		  }
		  else {
		  	  console.warn("Error, no correct maptype specified for d3 layer " + layername);
		  	  return;
		  }
		  return [point.x, point.y];
		};
		
		
		var olextentproject = function(x){
			var point = _this.map.getViewPortPxFromLonLat(new OpenLayers.LonLat(x[0],x[1]));
			return [point.x,point.y];
		}
		//Set the SVG to the correct dimensions
		this.set_svg = function(){
			var extent = _this.map.getExtent();
			bottomLeft = olextentproject([extent.left,extent.bottom]);
			topRight = olextentproject([extent.right,extent.top]);
			width = topRight[0] - bottomLeft[0];
			height = bottomLeft[1] - topRight[1];
			svg.attr("width", width)
				.attr("height", height)
				.style("margin-left", bottomLeft[0] + "px")
				.style("margin-top", topRight[1] + "px");
		}
		if (config.maptype == 'OpenLayers')
			this.set_svg();
		
		//Add nodeoverlay object for force layout nodes
		if (this.satellites){
		    this.nodemap = new nodeOverlay(svg,width,height);
		}
		
		var geoPath = d3.geo.path().projection(this.project);
		
		//A per feature styling method
		this.styling = function(d){ 
			for (var key in _this.style) { //First check for generic layer style
				d3.select(this).style(key,function(d){
					if (d.style && d.style[key])
						return d.style[key]; //Override with features style if present
 					else	
						return _this.style[key]; //Apply generic style
				});
			};
			//Now apply remaining styles of feature (possible doing a bit double work from previous loop)
			if (d.style) { //If feature has style information
				for (var key in d.style){ //run through the styles
					d3.select(this).style(key,d.style[key]); //and apply them
				}
			}
		};
		
		//A per feature styling method
		this.textstyling = function(d){ 
			for (var key in _this.labelconfig.style) { //First check for generic layer style
				d3.select(this).style(key,function(d){
					if (d.labelconfig && d.labelconfig.style && d.labelconfig.style[key])
						return d.labelconfig.style[key]; //Override with features style if present
 					else	
						return _this.labelconfig.style[key]; //Apply generic style
				});
			};
			//Now apply remaining styles of feature (possible doing a bit double work from previous loop)
			if (d.labelconfig && d.labelconfig.style) { //If feature has style information
				for (var key in d.labelconfig.style){ //run through the styles
					d3.select(this).style(key,d.labelconfig.style[key]); //and apply them
				}
			}
		};
		
		//Some path specific styles (point radius, label placement eg.)
		this.pathStyler = function(d){ 
		    if (d.style && d.style.radius)
		        geoPath.pointRadius(d.style.radius);
		    else if (_this.style && _this.style.radius)
		        geoPath.pointRadius(_this.style.radius);

		    return geoPath(d);
		};
		
		//Calculating the location of the label, based on settings
		this.textLocation = function(d){
		    var textLocation = geoPath.centroid(d);
		    var bounds = geoPath.bounds(d);
		    if (_this.style && _this.style.textlocation){
		        switch(_this.style.textlocation){
		          case 'ul':
		            textLocation[0] = bounds[0][0];
		            textLocation[1] = bounds[0][1];
		            break;
		          case 'ur':
		            textLocation[0] = bounds[1][0];
		            textLocation[1] = bounds[1][1];
		            break;
		          //TODO: add other positions
		        }
		    }
		    else {
		        textLocation[1] = textLocation[1] + 20; //a bit down..
		    }
		    return textLocation;
		}
		
		//The part where new data comes in
		f.data = function(collection){
		    if (!collection){
		        return _this.data; 
		    }
		    _this.data = collection;
	    
			if (config.maptype == 'OpenLayers')
				_this.set_svg();
            
			//Create a 'g' element first, in case we need to bind more then 1 elements to a data entry
			var entities = g.selectAll(".entity")
			    .data(collection.features, function(d){return d.id;});
			
			//On enter
			var newentity = entities.enter()
			    .append('g')
			    .classed('entity',true)			    
			    ;
			
			if (_this.type == "path" || _this.type == "circle"){
			    newentity.append("path")
			        //.classed("zoomable",true)
			        .attr('class',function(d){
			            if (_this.classfield)
			                return escape(d.properties[_this.classfield]);
			            else return "foo";
			        })
			        .each(_this.styling)
			        ;
			}
			//Forced tree layout
			if (_this.satellites){
			    entities.each(function(d,i){
                    var x = _this.project(d.geometry.coordinates)[0];
                    var y = _this.project(d.geometry.coordinates)[1];
                    _this.nodemap.addNode({
                        id: "nucleus" + d.id,  
                        x:x,y:y,
                        coords: d.geometry.coordinates, 
                        //name: d.properties.owner, 
                        type: 'nucleus', 
                        fixed: true,
                        imageurl: "./mapicons/stratego/stratego-sergeant.svg",
                        _children: [
                          {
                            name: "Sold 1",
                            id: "satellite" + d.id, 
                            type: 'satellite',
                            nucleus: "nucleus" + d.id,
                            fixed: false,
                            imageurl: "./mapicons/stratego/stratego-scout.svg",
                            _children: [
                              {
                                name: "M 1",
                                id: "satellite" + d.id + 'm', 
                                type: 'satellite',
                                nucleus: "nucleus" + d.id,
                                fixed: false,
                                imageurl: "./mapicons/stratego/stratego-miner.svg"
                            }, {
                                name: "M 2",
                                id: "satellite" + d.id +1+ 'm', 
                                type: 'satellite',
                                nucleus: "nucleus" + d.id +1,
                                fixed: false,
                                imageurl: "./mapicons/stratego/stratego-miner.svg"
                            }]
                          },{
                            name: "Sold 2",
                            id: "satellite" + d.id +1, 
                            type: 'satellite',
                            nucleus: "nucleus" + d.id +1,
                            fixed: false,
                            imageurl: "./mapicons/stratego/stratego-scout.svg"
                          }
                         ]
                    });
                    //_this.nodemap.addNode({
                    //    id: "satellite" + d.id, 
                    //    //name: 'Sat', 
                    //    type: 'satellite',
                    //    nucleus: "nucleus" + d.id,
                    //    fixed: false,
                    //    imageurl: "./mapicons/stratego/stratego-scout.svg"
                    //});
			    });
			    _this.nodemap.start();
			}
			if (_this.videobox){
			    var videobox = newentity.append('foreignObject')
			        //.classed('zoomable',true)
			        .classed('videobox',true)
			        .style('position','relative')
			        //.attr("x", function(d){return 500 + _this.project(d.geometry.coordinates)[0];} )
                    //.attr("y", function(d){return 500 + _this.project(d.geometry.coordinates)[1];} )
			        .attr('id',function(d){return 'videobox' + d.id;})
			        ;
			}
			if (_this.labels){
			    var label = newentity.append('g')
			        .classed('place-label',true);
			    //On new:	
				label
					.append('text')
					.attr("x",function(d) {return _this.textLocation(d)[0] ;})
					.attr("y",function(d) {return _this.textLocation(d)[1] ;})
					//.classed("zoomable",true)
					.attr('text-anchor', 'left')
					.style('stroke','white')
					.style('stroke-width','3px')
					.style('stroke-opacity',.8)
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					});
				label
					.append('text')
					.attr("x",function(d) {return _this.textLocation(d)[0] ;})
					.attr("y",function(d) {return _this.textLocation(d)[1] ;})
					//.classed("zoomable",true)
					.attr('text-anchor', 'left')
					.each(_this.textstyling)
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					})
			} //End of new label
			//Some cool looking effect upon new feature
			if (_this.coolcircles){
			 var coolcircle = newentity.append('g')
			        .classed('coolcircle',true);
			 coolcircle.append("circle")
                  .attr("class", "ring")
                  .attr("cx",function(d) { return _this.project(d.geometry.coordinates)[0]})
                  .attr("cy",function(d) { return _this.project(d.geometry.coordinates)[1]})
                  .attr("r", 100)
                  .each(_this.styling)
                  .style("stroke-width", 3)
                  .style("fill","none")
                .transition()
                  .ease("linear")
                  .duration(1500)
                  .each(_this.styling)
                  .style("stroke-opacity", 1e-6)
                  .style("stroke-width", 1)
                  .style("fill","none")
                  .attr("cx",function(d) { return _this.project(d.geometry.coordinates)[0]})
                  .attr("cy",function(d) { return _this.project(d.geometry.coordinates)[1]})
                  .attr("r", 6)
                  .remove();
            }

			//On update
			entities.each(function(d,i){
			    var entity = d3.select(this);
			    if (_this.type == "path" || _this.type == "circle"){
			        entity.select('path') //Only 1 path per entity
			            .transition().duration(500)
			            .attr("d",_this.pathStyler(d))
			            ;

			    }
			    if (_this.labels){
			        entity.select('.place-label')
                        .selectAll('text')
                        .transition().duration(500)
                        .attr("x", _this.textLocation(d)[0] )
                        .attr("y", _this.textLocation(d)[1] )
                        .text(function(foo) {
                            if (_this.labelconfig.field)
                                return d.properties[_this.labelconfig.field];
                            else
                                return d.id; 
                        })
			    }
			    if (_this.videobox){
			        entity.select('.videobox')
			            .attr("x", function(d){
			                return 500 + _this.project(d.geometry.coordinates)[0];
			            } )
			            .attr("y", function(d){return 500 + _this.project(d.geometry.coordinates)[1];} )
                        ;
			    }
			});
			//On exit	
			entities.exit().remove().transition().duration(500);
			return f;
        }
        
        //Redraw all features
		f.reset = function() {
			if (config.maptype == 'OpenLayers')
				_this.set_svg();
			    
			g.selectAll(".entity")
			    .each(function(d,i){
			        var entity = d3.select(this);
			        if (_this.type == "path" || _this.type == "circle"){
                        entity.select('path') //Only 1 path per entity
                            .attr("d",_this.pathStyler(d));
                    }
                     if (_this.labels){
                        entity.select('.place-label')
                            .selectAll('text')
                            .attr("x", _this.textLocation(d)[0] )
                            .attr("y", _this.textLocation(d)[1] )
                            .text(function(foo) {
                                if (_this.labelconfig.field)
                                    return d.properties[_this.labelconfig.field];
                                else
                                    return d.id; 
                            })
                    }
                    if (_this.videobox){
                        entity.select('.videobox')
                            .attr("x", function(d){
                                var x = _this.project(d.geometry.coordinates)[0];
                                return _this.project(d.geometry.coordinates)[0];
                            } )
                            .attr("y", function(d){
                                return  _this.project(d.geometry.coordinates)[1];
                            } )
                            ;
                    }
			    });
			//FORCETEST
			if (_this.satellites){
                _this.nodemap.redraw(_this.project);
            }
		}
		f.reset();
		
		
		
		return f;
	}

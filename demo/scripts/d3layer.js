function d3layer(layername, config){
		var f = {}, bounds, feature, collection;
		this.f = f;
		var _this = this;
		var layername = layername;
		this.type = config.type || "path";
		this.freq = 100;
		this.g = config.g;
		this.map = config.map;
		this.style = config.style;
		this.coolcircles = config.coolcircles || false;
		this.labels = config.labels || false;
		this.labelconfig = config.labelconfig;
		this.highlight = config.highlight || false;
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		this.bounds = [[0,0],[1,1]];
		var width, height,bottomLeft,topRight;
		
		if (config.maptype == 'OpenLayers'){//Getting the correct OpenLayers SVG. 
			var div = d3.selectAll("#" + config.divid);
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
				
		var geoPath = d3.geo.path().projection(this.project);
		
		
		this.styling = function(d){ //A per feature styling method
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
		
		this.textstyling = function(d){ //A per feature styling method
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
		
		this.pathStyler = function(d){ //Some path specific styles (point radius, label placement eg.)
		    if (d.style && d.style.radius)
		        geoPath.pointRadius(d.style.radius);
		    else if (_this.style && _this.style.radius)
		        geoPath.pointRadius(_this.style.radius);
		    
		    d.textLocation = geoPath.centroid(d);
		    var bounds = geoPath.bounds(d);
		    if (_this.style && _this.style.textlocation){
		        switch(_this.style.textlocation){
		          case 'ul':
		            d.textLocation[0] = bounds[0][0];
		            d.textLocation[1] = bounds[0][1];
		            break;
		          case 'ur':
		            d.textLocation[0] = bounds[1][0];
		            d.textLocation[1] = bounds[1][1];
		            break;
		        }
		    }
		    else
		        d.textLocation[1] = d.textLocation[1] + 20; //bit down..   

		    return geoPath(d);
		};
		
		f.data = function(collection){
			if (config.maptype == 'OpenLayers')
				_this.set_svg();

			if (_this.type == "path" || _this.type == "circle"){
				loc = g.selectAll("path")
					.data(collection.features, function(d){
						return d.id;
					});
				f.feature = loc.enter().append("path")
					.attr("d", _this.pathStyler)
					.classed("zoomable",true)
					.each(_this.styling)
				
				locUpdate = loc.transition().duration(500)
					.attr("d",_this.pathStyler);
				
				loc.exit().remove();
			}
			/* Obs? we're now drawing points as circles via the path
			else if (_this.type == "circlex"){
				loc = g.selectAll("circle")
				  .data(collection.features, function(d){return d.id;});
				f.feature = loc.enter().append("circle")
					.attr("cx",function(d) {return _this.project(d.geometry.coordinates)[0]})
					.attr("cy",function(d) { return _this.project(d.geometry.coordinates)[1]})
					.attr("r",10)
					//.attr("class",layername)
					.classed("zoomable",true)
					.each(_this.styling)
				
				//Apply styles
				//for (var key in _this.style) {
				//		f.feature.style(key,_this.style[key]);
				//};
				
				locUpdate = loc
					.transition().duration(100).ease("linear")			
					.attr("cx",function(d) {return _this.project(d.geometry.coordinates)[0]})
					.attr("cy",function(d) { return _this.project(d.geometry.coordinates)[1]})
					;
				loc.exit().remove();
			}
			*/
			else if (_this.type == "marker"){
				//Obs? f.collection = this.collection;
				loc = g.selectAll("image")
					.data(collection.features, function(d){return d.id;});
				 
				f.feature = loc.enter().append("image")
				 	.attr("xlink:href", function(d){return d.properties.icon })
				 	.attr("width", 30)
				 	.attr("height", 30)
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0]})
					.attr("y",function(d) { return _this.project(d.geometry.coordinates)[1]})
					//.attr("class",layername)
					.classed("zoomable",true)
					.each(_this.styling)
					
				locUpdate = loc
					.transition().duration(100).ease("linear")			
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0]})
					.attr("y",function(d) { return _this.project(d.geometry.coordinates)[1]})
					;
				loc.exit().remove();
			}
			
			if (_this.labels){
				// Append the place labels, setting their initial positions to
				// the feature's centroid
				var placeLabels = g.selectAll('.place-label')
					.data(collection.features, function(d){
						return d.id;
				});
				
					
				var label = placeLabels.enter()
					.append('g')
					.attr('class', 'place-label')
					;
					
				//On new:	
				label
					.append('text')
					//.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0] ;})
					//.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1] +20;})
					.attr("x",function(d) {return d.textLocation[0] ;})
					.attr("y",function(d) {return d.textLocation[1] ;})
					.attr('text-anchor', 'left')
					.classed('zoomable',true)
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
					.attr("x",function(d) {return d.textLocation[0] ;})
					.attr("y",function(d) {return d.textLocation[1] ;})
					.attr('text-anchor', 'left')
					.each(_this.textstyling)
					.classed('maintext',true)
					.classed('zoomable',true)
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					})
					
					//TODO: how about styling the labels?
				//On update:
				placeLabels
				    .each(function(d,i){ //Need to make slightly difficult loop to get to text in <g> element
				          d3.select(this).selectAll('text')
				            .transition().duration(500)
				            .attr("x",function(x) {return d.textLocation[0] ;})
                            .attr("y",function(x) {return d.textLocation[1] ;})
				    });
					
				//On Exit:
				
				placeLabels.exit().remove();
			}   
			return f;
        }
		var reset = function() {
			if (config.maptype == 'OpenLayers')
				_this.set_svg();
	
			g.selectAll("image.zoomable")
				.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1];})
			g.selectAll("circle.zoomable")
				.attr("cx",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("cy",function(d) {return _this.project(d.geometry.coordinates)[1];})
		  	//g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
			g.selectAll(".zoomable")
				.attr("d", _this.pathStyler);
			g.selectAll("text.zoomable")
				.attr("x",function(d) {return d.textLocation[0] ;})
				.attr("y",function(d) {return d.textLocation[1] ;})
			  	
		}
		
		core.bind("moveend", reset);
		core.events.bind("locationChange", reset);
		reset();
		return f;
	}

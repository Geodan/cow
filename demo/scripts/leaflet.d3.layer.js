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
		this.chatboxes = config.chatboxes || "false";
		this.coolcircles = config.coolcircles || "false";
		this.labels = config.labels || "false";
		this.labelconfig = config.labelconfig;
		this.highlight = config.highlight || "false";
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		this.bounds = [[0,0],[1,1]];
		var width, height,bottomLeft,topRight;
		//Getting the correct OpenLayers SVG. Probably not working with LeafLet this way.. 
		var div = d3.selectAll("#" + config.divid);
		div.selectAll("svg").remove();
		var svg = div.append("svg");
		var g = svg.append("g");
		
		// Projecting latlon to screen coordinates
		this.project = function(x) {
		  //var point = this.map.latLngToLayerPoint(new L.LatLng(x[1], x[0])); //Leaflet version
		  var point = _this.map.getViewPortPxFromLonLat(new OpenLayers.LonLat(x[0],x[1])); //OpenLayers version
		  return [point.x, point.y];
		};
		
		//Set the SVG to the correct dimensions
		this.set_svg = function(){
			var extent = _this.map.getExtent();
			bottomLeft = _this.project([extent.left,extent.bottom]);
			topRight = _this.project([extent.right,extent.top]);
			width = topRight[0] - bottomLeft[0];
			height = bottomLeft[1] - topRight[1];
			svg.attr("width", width)
				.attr("height", height)
				.style("margin-left", bottomLeft[0] + "px")
				.style("margin-top", topRight[1] + "px");
		}
		
		this.set_svg();
				
		var path = d3.geo.path().projection(this.project);
		
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
		
		f.data = function(collection){
			_this.set_svg();
			
			if (_this.labels){
				// Append the place labels, setting their initial positions to
				// the feature's centroid
				var placeLabels = svg.selectAll('.place-label')
					.data(collection.features, function(d){
						return d.id;
				});
				
					
				var text = placeLabels.enter()
					.append("svg:g")
					.attr('class', 'place-label');
					
				//On new:	
				text
					.append('svg:text')
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0] ;})
					.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1] +20;})
					.attr('text-anchor', 'middle')
					.style('stroke','white')
					.style('stroke-width','3px')
					.style('stroke-opacity',.8)
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					});
				text
					.append('svg:text')
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0] ;})
					.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1] +20;})
					.attr('text-anchor', 'middle')
					.text(function(d) {
							if (_this.labelconfig.field)
								return d.properties[_this.labelconfig.field];
							else
								return d.id; 
					})
					
					//TODO: how about styling the labels?
				//On update:
				placeLabels
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
					.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1] +20;})
					
				//On Exit:	
				placeLabels.exit().remove();
			}
			
			if (_this.type == "path"){
				loc = g.selectAll("path")
					.data(collection.features, function(d){
						return d.id;
					});
				f.feature = loc.enter().append("path")
					.attr("d", path)
					.classed("zoomable",true)
					.each(_this.styling)
				
				f.feature.append('foreignObject')
				.attr("width", 480)
				.attr("height", 500)
					.append("xhtml:div")
					.append('xhtml:p')
					.style("font", "14px 'Helvetica Neue'")
					.html('BPEPEPEPEPEPE!!!!');

				
				locUpdate = loc.transition().duration(500)
					.attr("d",path);
				
				loc.exit().remove();
			}
			else if (_this.type == "circle"){
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
			return f;
        }
		var reset = function() {
			_this.set_svg();
		 
		  	svg.selectAll(".place-label").selectAll("text")
				.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1] +20;})

			g.selectAll(".zoomable")
				.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1];})
				
			g.selectAll("image.zoomable")
				.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1];})
			g.selectAll("circle.zoomable")
				.attr("cx",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("cy",function(d) {return _this.project(d.geometry.coordinates)[1];})
		  	//g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
			g.selectAll(".zoomable")
				.attr("d", path)
			  	
		}
		
		core.bind("moveend", reset); 
		reset();
		return f;
	}

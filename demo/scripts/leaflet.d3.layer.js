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
		this.coolcircles = config.coolcircles || "false";
		this.labels = config.labels || "false";
		this.labelconfig = config.labelconfig;
		this.highlight = config.highlight || "false";
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		this.bounds = [[0,0],[1,1]];
		var width, height,bottomLeft,topRight;
		
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
		
		// Create a label for every marker
		this.makelabels = function(x){
			if (this.labels){
				var txt = svg.append("text")
					  .text(x.properties[ _this.labelconfig.field ])
					  .attr("x",function(d) {return _this.project(x.geometry.coordinates)[0];})
					  .attr("y",function(d) {return _this.project(x.geometry.coordinates)[1];})
					  .attr("text-anchor", "middle")
					  .classed("zoomable",true);
				//Label style will be same as marker style
				for (var key in _this.style) {
					txt.style(key,_this.style[key]);
				};
			}
		}
		
		var path = d3.geo.path().projection(this.project);
		this.force;
		
		f.data = function(collection){
			_this.set_svg();
			
			if (_this.type == "path"){
				loc = g.selectAll("path")
					.data(collection.features, function(d){
						return d.id;
					});
				f.feature = loc.enter().append("path")
					.attr("d", path)
					.each(function(d,i){_this.makelabels(d);})
					.classed("zoomable",true)

				locUpdate = loc.transition().duration(500)
					.attr("d",path);
				
				//Apply styles
				for (var key in _this.style) {
						f.feature.style(key,_this.style[key]);
				};
				
				loc.exit().remove();
			}
			else if (_this.type == "marker"){
				f.collection = this.collection;
				
				// Store the projected coordinates of the places for the foci and the labels
				collection.features.forEach(function(d, i) {
					var c = _this.project(d.geometry.coordinates);
					d.dx = c[0];
					d.dy = c[1];
					d.x = c[0];
					d.y = c[1];
				});
				// Create the force layout with a slightly weak charge
				_this.force = d3.layout.force()
					.nodes(collection.features)
					.charge(-40)
					.friction(0.5)
					.gravity(0)
					.size([width, height]);
				// Append the place labels, setting their initial positions to
				// the feature's centroid
				var placeLabels = svg.selectAll('.place-label')
					.data(collection.features)
					.enter()
					.append('text')
					.attr('class', 'place-label')
					.classed('zoomable',true)
					.attr('x', function(d) { return d.x })
					.attr('y', function(d) { return d.y; })
					.attr('text-anchor', 'middle')
					.text(function(d) { return d.properties.owner; });
				_this.force.on("tick", function(e) {
					var k = .1 * e.alpha;
					collection.features.forEach(function(o, j) {
						// The change in the position is proportional to the distance
						// between the label and the corresponding place (foci)
						o.y += (o.dy - o.y) * k;
						o.x += (o.dx - o.x) * k;
					});
				
					// Update the position of the text element
					svg.selectAll("text.place-label")
						.attr("x", function(d) { return d.x;})
						.attr("y", function(d) { return d.y;});
				});
				//TT: force is not perfect yet, disabled for now..
				//_this.force.start();
				
				loc = g.selectAll("image")
				  .data(collection.features, function(d){return d.id;});
				 
				 f.feature = loc.enter().append("image")
				 	.attr("xlink:href", function(d){return d.properties.icon })
				 	.attr("width", 30)
				 	.attr("height", 30)
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0]})
					.attr("y",function(d) { return _this.project(d.geometry.coordinates)[1]})
					//.each(function(d,i){_this.makelabels(d);})
					//.attr("class",layername)
					.classed("zoomable",true)
					//Apply styles
					for (var key in _this.style) {
							f.feature.style(key,_this.style[key]);
					};
					
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
			
		  if (_this.type == "marker"){
				svg.selectAll("text.place-label")
					
					.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0]})
					.attr("y",function(d) {return _this.project(d.geometry.coordinates)[1]})
					
					.each(function(d) {
						var c = _this.project(d.geometry.coordinates);
						d.dx = c[0];
						d.dy = c[1];
						d.x = c[0];
						d.y = c[1];	
					});
			//if (_this.force) //Can be some delay..
				//_this.force.start();
				//_this.force.stop();
			  g.selectAll(".zoomable")
				.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("y",function(d) { return _this.project(d.geometry.coordinates)[1];})
		  }
		  else{ //Not marker..
			  g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
			  g.selectAll(".zoomable")
			  	.attr("d", path)
			  	
		  }
		}
		
		core.bind("moveend", reset); 
		reset();
		return f;
	}

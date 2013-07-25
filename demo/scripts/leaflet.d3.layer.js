function d3layer(layername, config){
		var f = {}, bounds, feature, collection;
		this.f = f;
		var _this = this;
		var layername = layername;
		this.type = config.type || "path";
		this.freq = 100;
		this.g = config.g;
		this.map = config.map;
		this.coolcircles = config.coolcircles || "false";
		this.labels = config.labels || "false";
		this.highlight = config.highlight || "false";
		this.fillcolor = config.fillcolor || "green";
		this.strokecolor = config.strokecolor || "green";
		this.strokewidth = config.strokewidth || 1;
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		this.bounds = [[0,0],[1,1]];
		var div = d3.selectAll("#" + config.divid);
		div.selectAll("svg").remove();
		var svg = div.append("svg");
		var g = svg.append("g");
		
		
		
		

		this.project = function(x) {
		  //var point = this.map.latLngToLayerPoint(new L.LatLng(x[1], x[0])); //Leaflet version
		  var point = _this.map.getViewPortPxFromLonLat(new OpenLayers.LonLat(x[0],x[1])); //OpenLayers version
		  return [point.x, point.y];
		};
		var path = d3.geo.path().projection(this.project);
		
		f.data = function(collection){
			_this.bounds = d3.geo.bounds(collection);
            console.debug('Collection bounds: ' + _this.bounds);
			if (_this.type == "path"){
				loc = g.selectAll("path")
					.data(collection.features, function(d){
						return d.id;
					});
				f.feature = loc.enter().append("path")
					.attr("d", path)
					.classed("zoomable",true)
					.style("stroke-width","2")
					.style("stroke","steelBlue")
					.attr('fill',"none");
				locUpdate = loc.transition().duration(100)
					.attr("d",path);
				loc.exit().remove();
			}
			else if (_this.type == "marker"){
				f.collection = this.collection;
				/* Add a LatLng object to each item in the dataset */
				f.collection.features && f.collection.features.forEach(function(d) {
					d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0])
				});
				loc = g.selectAll("circle")
				  .data(f.collection.features, function(d){return d.id;});
				 
				 f.feature = loc.enter().append("circle")
					.attr("cx",function(d) { return this.project(d.LatLng).x})
					.attr("cy",function(d) { return this.project(d.LatLng).y})
					.attr("r", 10)
					//.attr("class",layername)
					.classed("zoomable",true)
					.style("stroke-width",function(d){
						if (d.strokewidth)
							return d.strokewidth;
						else
							return _this.strokewidth;
					})
					.style("stroke", function(d){
						if (d.strokecolor)
							return d.strokecolor;
						else
							return _this.strokecolor;
					})
					.attr('fill',function(d){
						if (d.color)
							return d.color;
						else
							return _this.fillcolor;
					});
					
				locUpdate = loc
					.transition().duration(this.freq + 100).ease("linear")			
					.attr("cx",function(d) { return this.project(d.LatLng).x})
					.attr("cy",function(d) { return this.project(d.LatLng).y})
					;
				loc.exit().remove();
			}
			return f;
        }
		var reset = function() {
		  console.log('Updating');
		  var bottomLeft = _this.project(_this.bounds[0]),
				topRight = _this.project(_this.bounds[1]);

			svg.attr("width", topRight[0] - bottomLeft[0])
				.attr("height", bottomLeft[1] - topRight[1])
				.style("margin-left", bottomLeft[0] + "px")
				.style("margin-top", topRight[1] + "px");
				
		  if (_this.type == "marker"){
			  g.selectAll(".zoomable")
				/* Using leaflets projection function instead of d3's */
				.transition().duration(1)
				.attr("cx",function(d) { return _this.project(d.LatLng).x})
				.attr("cy",function(d) { return _this.project(d.LatLng).y})
				.attr("r",10);
		  }
		  else{
		  	  g.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
		  	  g.selectAll(".zoomable").attr("d", path);
		  }
		}
		core.bind("moveend", reset); 
		reset();
		return f;
	}

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
		this.highlight = config.highlight || "false";
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
			
            
            
			if (_this.type == "path"){
				loc = g.selectAll("path")
					.data(collection.features, function(d){
						return d.id;
					});
				f.feature = loc.enter().append("path")
					.attr("d", path)
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
				/* Add a LatLng object to each item in the dataset */
				collection.features && collection.features.forEach(function(d) {
					//d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0])
					d.LatLng = new OpenLayers.LonLat(d.geometry.coordinates[1],d.geometry.coordinates[0]);
				});
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
		  console.log('Updating');
		  var extent = _this.map.getExtent();
		  
		  //var bottomLeft = _this.project(_this.bounds[0]),
		  //	topRight = _this.project(_this.bounds[1]);
		  var bottomLeft = _this.project([extent.left,extent.bottom]),
				topRight = _this.project([extent.right,extent.top]);

			svg.attr("width", topRight[0] - bottomLeft[0])
				.attr("height", bottomLeft[1] - topRight[1])
				.style("margin-left", bottomLeft[0] + "px")
				.style("margin-top", topRight[1] + "px");
				
		  if (_this.type == "marker"){
			  g.selectAll(".zoomable")
				/* Using leaflets projection function instead of d3's */
				.attr("x",function(d) {return _this.project(d.geometry.coordinates)[0];})
				.attr("y",function(d) { return _this.project(d.geometry.coordinates)[1];})
				//.attr("r",10);
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

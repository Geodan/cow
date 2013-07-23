function d3layer(layername, config){
		var f = {}, bounds, feature, collection;
		this.f = f;
		var _this = this;
		var layername = layername;
		this.coolcircles = config.coolcircles || "false";
		this.labels = config.labels || "false";
		this.highlight = config.highlight || "false";
		this.fillcolor = config.fillcolor || "green";
		this.strokecolor = config.strokecolor || "green";
		this.strokewidth = config.strokewidth || 1;
		this.scale = config.scale || 'px';
		this.pointradius = config.pointradius || 5;
		var svg = d3.select("#map").select("svg"); //TODO
		var g = svg.append("g");

		this.tooltipText = function(d){
			var str = "";
			for (x in d.properties){
				str = str + " \n " + x + ": " + d.properties[x];
			}
			return str;
		}
		
		_this.makecoolcircles = function(x){
			if (_this.coolcircles){
				svg.append("circle")
					  .attr("class", "ring")
					  .attr("cx",function(d) { return map.latLngToLayerPoint(x.LatLng).x})
					  .attr("cy",function(d) { return map.latLngToLayerPoint(x.LatLng).y})
					  .attr("r", 100)
					  .style("stroke-width", 3)
					  .style("stroke", "green")
					.transition()
					  .ease("linear")
					  .duration(1500)
					  .style("stroke-opacity", 1e-6)
					  .style("stroke-width", 1)
					  .style("stroke", "green")
					  .attr("cx",function(d) { return map.latLngToLayerPoint(x.LatLng).x})
					  .attr("cy",function(d) { return map.latLngToLayerPoint(x.LatLng).y})
					  .attr("r", 6)
					  .remove();
				}
		}
		_this.makelabels = function(x){
			if (_this.labels){
				svg.append("text")
					  .text(x.properties.title)
					  .attr('x', function(d) { return map.latLngToLayerPoint(x.LatLng).x -20})
					  .attr('y', function(d) { return map.latLngToLayerPoint(x.LatLng).y -20})
					  .attr("text-anchor", "middle")
					  .style("opacity", 1)
					  .style("color", "steelblue")
					.transition()
					  //.ease(")
					  .duration(8000)
					  .text(x.properties.title)
					  .style("opacity", 0)
					  .style("color", "steelblue")
					  .attr('cx', function(d) { return map.latLngToLayerPoint(x.LatLng).x -200})
					  .attr('cy', function(d) { return map.latLngToLayerPoint(x.LatLng).y -20})
					  .remove();
				}
		}
		
		_this.onmouseover = function(item,data){
			tmp2 = item;
			if (_this.highlight){
				d3.select(item)
					.transition().duration(10)
					//.call(d3.helper.tooltip(function(d, i){return _this.tooltipText(d);}))
					.attr('r',item.r.baseVal.value + 5)
					.attr('fill','red')
					;
				svg.append("text")
					  .text(data.id)
					  .attr('x', function(d) { return map.latLngToLayerPoint(data.LatLng).x -20})
					  .attr('y', function(d) { return map.latLngToLayerPoint(data.LatLng).y -20})
					  .attr("text-anchor", "middle")
					  .style("opacity", 1)
					  .style("color", "steelblue")
					.transition()
					  //.ease(")
					  .duration(8000)
					  .text(data.id)
					  .style("opacity", 0)
					  .style("color", "steelblue")
					  .attr('cx', function(d) { return map.latLngToLayerPoint(data.LatLng).x -200})
					  .attr('cy', function(d) { return map.latLngToLayerPoint(data.LatLng).y -20})
					  .remove();
			}
				
		}
		_this.onmouseout = function(item,data){
			d3.select(item)
			.transition().duration(1000)
				.attr("r",calculate_radius)
				.style("stroke", function(d){
					if (d.strokecolor)
						return d.strokecolor;
					else
						return _this.strokecolor;
				})
			 	
				.attr('fill',function(d){
					if (data.color)
						return data.color;
					else
						return _this.fillcolor;
				});
		}
		
		_this.onmousclick = function(item,data){
			console.log('clicked '  + data.properties.id);
			//d3.select('#map-info').selectAll("p").remove();
			//d3.select('#map-info').append("p")
			//	.text(function(d){
			//			return _this.tooltipText(data);
			//	});
		}
		function calculate_radius(d){
			if (_this.scale == 'd')
				return (d.pointradius || _this.pointradius) * Math.pow(2,map.getZoom())
			else if (_this.scale == 'm') //TODO convert meters
				return (d.pointradius || _this.pointradius) * Math.pow(2,map.getZoom())
			else
				return (d.pointradius || _this.pointradius);
		}
		
		f.data = function(x){
			f.collection = x;
			/* Add a LatLng object to each item in the dataset */
			f.collection.features && f.collection.features.forEach(function(d) {
				d.LatLng = new L.LatLng(d.geometry.coordinates[1],d.geometry.coordinates[0])
			});
			loc = g.selectAll("circle")
			  .data(f.collection.features, function(d){return d.id;});
			 
			 f.feature = loc.enter().append("circle")
				.attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x})
				.attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y})
			 	.each(function(d,i){_this.makecoolcircles(d);})
			 	.each(function(d,i){_this.makelabels(d);})
			 	.attr("r", calculate_radius)
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
				.transition().duration(freq + 100).ease("linear")			
				.attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x})
				.attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y})
				;
			loc.exit().remove();
			f.feature.on("mouseover",function(d) {
				_this.onmouseover(this,d);
			})
			f.feature.on("mouseout",function(d) {
				_this.onmouseout(this,d);
			})
			
			f.feature.on("click",function(d) {
				console.log(d);
				_this.onmousclick(this,d);
			})
			return f;
        }
		var update = function() {
		  console.log('Updating');
		  g.selectAll(".zoomable")
		  	/* Using leaflets projection function instead of d3's */
		  	.transition().duration(1)
		  	.attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x})
		  	.attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y})
		  	.attr("r",calculate_radius)
		}
		//core.map.on("viewreset", update); //TODO
		update();
		return f;
	}

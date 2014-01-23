/*
Based on: https://github.com/rclark/leaflet-d3-layer/blob/master/dist/scripts/leaflet-d3-layer.js
*/

(function() {
  var root;

  root = this;

  L.GeoJSON.d3 = L.GeoJSON.extend({
    initialize: function(geojson, options) {
      this.geojson = geojson;
      options = options || {};
      options.layerId = options.layerId || ("leaflet-d3-layer-" + (Math.floor(Math.random() * 101)));
      options.onEachFeature = function(geojson, layer) {};
      L.setOptions(this, options);
      return this._layers = {};
    },
    data: function(data){
        if (data){
            this.geojson = data;
            if (data.features.length > 0){
                this.reload();
            }
            return this;
        }
        else {
            return this.geojson;
        }
    },
    reload: function(){
        var f;
        var self = this;
        var map = self._map;
        var project = function(d3pnt) {
            //if (!isNaN(d3pnt[0]) && !isNaN(d3pnt[1])){
                var geoPnt, pixelPnt;
                geoPnt = new L.LatLng(d3pnt[1], d3pnt[0]);
                pixelPnt = map.latLngToLayerPoint(geoPnt);
                return [pixelPnt.x, pixelPnt.y];
            //}
            //else {
            //    console.warn('Projecting invalid point: ', d3pnt);
            //    return [0,0];
            //}
        };
        this.project = project;
        var options = self.options;
        var svg = self._svg;
        var g = self._g;
        var bounds = d3.geo.bounds(this.geojson);
        this.bounds = bounds;
        var path = d3.geo.path().projection(project);
        this.path = path;
        var bottomLeft, bufferPixels, topRight;
        var style = options.style;
		var onClick = options.onClick;
		var onMouseover = options.onMouseover;
		var mouseoverContent = options.mouseoverContent;
		var classfield = options.classfield;
		var colorfield = options.colorfield;
		var satellites = options.satellites || false;
		var eachFunctions = options.eachFunctions || false;	
		var labels = options.labels || false;
		this.labels = labels;
		var labelconfig = options.labelconfig;
		var highlight = options.highlight || false;
		var scale = options.scale || 'px';
		var pointradius = options.pointradius || 5;
		
        bufferPixels = 15;
        bottomLeft = project(bounds[0]);
        topRight = project(bounds[1]);
        svg.attr("width", topRight[0] - bottomLeft[0] + 2 * bufferPixels);
        svg.attr("height", bottomLeft[1] - topRight[1] + 2 * bufferPixels);
        svg.style("margin-left", "" + (bottomLeft[0] - bufferPixels) + "px");
        svg.style("margin-top", "" + (topRight[1] - bufferPixels) + "px");
        g.attr("transform", "translate(" + (-bottomLeft[0] + bufferPixels) + "," + (-topRight[1] + bufferPixels) + ")");
        
        //Adding a tooltip div
        /*
        var tooltipdiv = d3.select("body").append("div")   
            .attr("class", "tooltip")               
            .style("opacity", 0);
        */
        
        
        
        //TODO move out of core
		var labelgenerator = function(d){
		    if (labelconfig.field){
		        var str = d.properties[labelconfig.field];
		        if (str && str.length > 10){ 
		              return str.substr(0,16) + "..."; //Only first 10 chars
		        }
		        else {
		            return str;
		        }
            }
            else {
                return d.id;
            }
		};
		this.labelgenerator = labelgenerator; 
		var click = function(d){
		    d3.event.stopPropagation();//Prevent the map from firing click event as well
		    if (onClick){
		        onClick(d,this, self);
		    }
		};
		
		var mouseover = function(d){
		    if (!d.origopac){
		        d.origopac = d3.select(this).style('opacity');
		    }
		    d3.select(this)
		        .transition().duration(100)
		        .style('opacity',d.origopac * 0.2);
		    
		    if (mouseoverContent){
		        /*
                    tooltipdiv.transition()        
                        .duration(200)      
                        .style("opacity", 0.9);      
                    tooltipdiv.html(d[mouseoverContent] + "<br/>")  
                        .style("left", (d3.event.pageX) + "px")     
                        .style("top", (d3.event.pageY - 28) + "px");
                 */
                }
		    if (onMouseover){
		        onMouseover(d,this);
		    }
		};
		var mouseout = function(d){
		    d3.select(this)
		        .transition().duration(100)
		        .style('opacity',d.origopac);
		    if (mouseoverContent){
		        /*
		        tooltipdiv.transition()        
                    .duration(500)      
                    .style("opacity", 0);
                 */
            }
		};
        
      //Build up the element
        var build = function(d){
          var entity = d3.select(this);
          //Point/icon feature
          if (d.style && d.style.icon && d.geometry.type == 'Point'){ 
              var x = project(d.geometry.coordinates)[0];
              var y = project(d.geometry.coordinates)[1];
              var img = entity.append("image")
                    //.transition().duration(500)
                    .on("click", click)
		            .on('mouseover',mouseover)
		            .on('mouseout',mouseout);
          }
          //Path feature
          else{
            var path = entity.append("path")
                //.transition().duration(500)
                .on("click", click)
		        .on('mouseover',mouseover)
		        .on('mouseout',mouseout);
          }
        };
        
		//A per feature styling method
		var styling = function(d){
		  var entity = d3.select(this);
		  //Point/icon feature
		  if (d.style && d.style.icon && d.geometry.type == 'Point'){ 
		      var x = project(d.geometry.coordinates)[0];
              var y = project(d.geometry.coordinates)[1];
		      var img = entity.select("image")
                    .attr("xlink:href", function(d){
                            if (d.style.icon) {return d.style.icon;}
                            else {return "./mapicons/stratego/stratego-flag.svg";} //TODO put normal icon
                    })
                    .classed("nodeimg",true)
                    .attr("width", 32)
                    .attr("height", 37)
                    .attr("x",x-25)
                    .attr("y",y-25)
                    .style('opacity',function(d){ //special case: opacity for icon
                            return d.style.opacity || style.opacity || 1;
                    });
             
		  }
		  //Path feature
		  else{
		    var path = entity.select("path");
			for (var key in style) { //First check for generic layer style
				path.style(key,function(d){
					if (d.style && d.style[key]){
				        return d.style[key]; //Override with features style if present
					}
 					else{ //Style can be defined by function...
 					    if (typeof(style[key]) == "function") {
                            var f = style[key];
                            return  f(d);
                        }
                        else {//..or by generic style string
                            return style[key]; 
                        }
                    }
				});
			}
			//Now apply remaining styles of feature (possible doing a bit double work from previous loop)
			if (d.style) { //If feature has style information
				for (var key in d.style){ //run through the styles
				    if (d.style[key] != null){
				        path.style(key,d.style[key]); //and apply them
				    }
				}
			}
		  }
		};
		//A per feature styling method
		var textstyling = function(d){ 
			for (var key in labelconfig.style) { //First check for generic layer style
				d3.select(this).style(key,function(d){
					if (d.labelconfig && d.labelconfig.style && d.labelconfig.style[key]){
						return d.labelconfig.style[key]; //Override with features style if present
					}
 					else {	
						return labelconfig.style[key]; //Apply generic style
					}
				});
			}
			//Now apply remaining styles of feature (possible doing a bit double work from previous loop)
			if (d.labelconfig && d.labelconfig.style) { //If feature has style information
				for (var key in d.labelconfig.style){ //run through the styles
					d3.select(this).style(key,d.labelconfig.style[key]); //and apply them
				}
			}
		};
		//Some path specific styles (point radius, label placement eg.)
		var pathStyler = function(d){ 
		    if (d.style && d.style.radius){
		        path.pointRadius(d.style.radius);
		    }
		    else if (style && style.radius){
		        path.pointRadius(style.radius);
		    }
		    return path(d);
		};
		this.pathStyler = pathStyler;
		//Calculating the location of the label, based on settings
		var textLocation = function(d){
		    var textLocation = path.centroid(d);
		    var bounds = path.bounds(d);
		    if (style && style.textlocation){
		        switch(style.textlocation){
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
		};
		this.textLocation = textLocation;
		
		//Here we start processing the data
		if (this.data.type === "Topology") {
		    this.data = root.topojson.feature(this.geojson, this.geojson.objects.features);
		}
		var entities = g.selectAll(".entity")
            .data(this.geojson.features, function(d) {
                return d.id;
            });
        //On enter
        var newentity = entities.enter()
            .append("g")
            .classed('entity',true)
            .attr('id',function(d){
                    return 'entity'+ d.id;
            });
        newentity.each(build);
       
        if (labels){
            var label = newentity.append('g')
                .classed('place-label',true);
            //On new:	
            label
                .append('text')
                .attr("x",function(d) {return textLocation(d)[0] ;})
                .attr("y",function(d) {return textLocation(d)[1] ;})
                //.classed("zoomable",true)
                .attr('text-anchor', 'left')
                .style('stroke','white')
                .style('stroke-width','3px')
                .style('stroke-opacity',0.8)
                .text(function(d){return labelgenerator(d);});
            label
                .append('text')
                .attr("x",function(d) {return textLocation(d)[0] ;})
                .attr("y",function(d) {return textLocation(d)[1] ;})
                //.classed("zoomable",true)
                .attr('text-anchor', 'left')
                .each(textstyling)
                .text(function(d){return labelgenerator(d);});
      } //End of new label
       
       
      //On update
      entities.each(styling);
      entities.each(function(d,i){
			    var entity = d3.select(this);
			    var x = path.centroid(d)[0];
                var y = path.centroid(d)[1];
                
                if (d.style && d.style.icon && d.geometry.type == 'Point'){
                    entity.select('image')
                        .attr("x",x-25)
                        .attr("y",y-25);
                }
                else{
                    entity.select('path') //Only 1 path per entity
                        .attr("d",pathStyler(d))
                        //.style('opacity',0)
                        .transition().duration(500)
                        .style('opacity',1);
                }
			    
			    if (labels){
			        entity.select('.place-label')
                        .selectAll('text')
                        .transition().duration(500)
                        .attr("x", textLocation(d)[0] )
                        .attr("y", textLocation(d)[1] )
                        .text(labelgenerator(d));
			    }
			});
	  
	  //On exit
      entities.exit().remove().transition().duration(500);
      //Reset view after zoom
      var reset = function(self){
          var svg = self._svg;
          var g = self._g;
          var bounds = self.bounds;
          
          var bottomLeft, bufferPixels, topRight;
          bufferPixels = 15;
          bottomLeft = project(bounds[0]);
          topRight = project(bounds[1]);
          svg.attr("width", topRight[0] - bottomLeft[0] + 2 * bufferPixels);
          svg.attr("height", bottomLeft[1] - topRight[1] + 2 * bufferPixels);
          svg.style("margin-left", "" + (bottomLeft[0] - bufferPixels) + "px");
          svg.style("margin-top", "" + (topRight[1] - bufferPixels) + "px");
          g.attr("transform", "translate(" + (-bottomLeft[0] + bufferPixels) + "," + (-topRight[1] + bufferPixels) + ")");
          //return feature.attr("d", path);
          //var self = this;
          self._g.selectAll(".entity")
            .each(function(d,i){
                var entity = d3.select(this);
                var x = self.path.centroid(d)[0];
                var y = self.path.centroid(d)[1];
    
                if (d.style && d.style.icon && d.geometry.type == 'Point'){
                    entity.select('image')
                        .attr("x",x-25)
                        .attr("y",y-25)
                        .moveToFront();
                }
                else{
                    entity.select('path') //Only 1 path per entity
                        .attr("d",self.pathStyler(d));
                }
                
                 if (self.labels){
                    entity.select('.place-label')
                        .selectAll('text')
                        .attr("x", self.textLocation(d)[0] )
                        .attr("y", self.textLocation(d)[1] )
                        .text(self.labelgenerator(d));
                }
                entity.select('g.zoomable')
                    .attr("transform", function(d){
                        if (d.geometry.type == 'Point'){
                            var x = this.project(d.geometry.coordinates)[0];
                            var y = this.project(d.geometry.coordinates)[1];
                        }
                        else {
                            x = self.path.centroid(d)[0];
                            y = self.path.centroid(d)[1];
                        }
                        return "translate(" + x + "," + y + ")";
                    })
                    .transition().duration(500)
                    .attr('opacity',function(d){
                            if (d.minzoomlevel && d.minzoomlevel > self.getZoomLevel()){
                                return 0;
                            }
                            else {return 1;}
                    });
          });
      };
      map.on("viewreset", function(){
          if (self.geojson.features.length > 0){
              reset(self);
          }
      });
      //var feature = g.selectAll('path');
      //return feature.attr("d", path);
      
      return this.resetFunction = reset;
    },
    
    updateData: function(map) {
      var self = this;
      this._map = map;
      
      if (this.geojson.features.length > 0){
          return this.reload();
      }
      return this.resetFunction = this.reload;
    },
    onAdd: function(map) {
      var d3Selector, g, overlayPane, svg;
      overlayPane = map.getPanes().overlayPane;
      d3Selector = d3.select(overlayPane);
      this._svg = svg = d3Selector.append("svg");
      svg.attr("class", "leaflet-d3-layer");
      svg.attr("id", this.options.layerId);
      this._g = g = svg.append("g");
      g.attr("class", "leaflet-zoom-hide leaflet-d3-group");
      return this.updateData(map);
    },
    onRemove: function(map) {
      this._svg.remove();
      return map.off("viewreset", this.resetFunction);
    }
  });
}).call(this);

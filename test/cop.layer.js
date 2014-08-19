var Cop = Cop || {};

/**
	lodui.layer is instantiated from the map object
**/
Cop.layer = function(id, map, config){
	this._data = config.data;
	this._id = id;
	this._map = map;
	this._r = config.r;
	this._type = config.type || 'path';
	this._style = config.style || {};
	this._g = this._map.vector.append('g').attr('id',this._id); //now we have a layer to add data on
	this._onmouseover = config.onmouseover;
	this._onclick = config.onclick;
}

Cop.layer.prototype.redraw = function(){
	var projection = this._map.projection;
	var pointprojection = this._map.pointprojection;
	var clicked = this._map.clicked;
	var self = this;
	var style = this._style;
	
	//A per feature styling method
	var styling = function(d){
		var entity = d3.select(this);
		for (var key in style) { //First check for generic layer style
			entity
				.style(key,function(d){
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
		};
		//Now apply remaining styles of feature (possible doing a bit double work from previous loop)
		if (d.style) { //If feature has style information
			for (var key in d.style){ //run through the styles
				entity
					.style(key,d.style[key]); //and apply them
			}
		}
	}
	
	var generic = function(d){
		var entity = d3.select(this);
		if (this._type == 'path'){
			//no need
		}
		else {
			//recalc radius
			entity.attr('cx', function(d){
					var point = d.geometry.coordinates;
					return projection(point)[0];
				})
				.attr('cy', function(d){
					var point = d.geometry.coordinates;
					return projection(point)[1];
				})
			.transition().duration(500).attr('r',function(d){
				//return (d[self._r] || d.r || 0) / self._map.zoom.scale();
				return 10;
			});
		}
		entity
			.on('mouseover', function(d){
				if (self._onmouseover){
					self._onmouseover(d);
				}
				else {
					//some default
				}
				d3.select(this).style('opacity',0.8);
			})
			.on('mouseout', function(d){
				d3.select(this).style('opacity',1);
				d3.selectAll('.mouseover').style('display', 'none');
			})
			.on('click', self._onclick);
	}
	
	d3.select('#'+ this._id).selectAll('.entity')
		.each(generic)
		.each(styling);
}


/** 
	layer.data(features) - adds/replaces features for specific layer
**/
Cop.layer.prototype.data = function(data){
	var projection = this._map.projection;
	var pointprojection = this._map.pointprojection;
	var clicked = this._map.clicked;
	var self = this;
	var style = this._style;

	var entities;
	if (this._type == 'path'){
		entities = this._g.selectAll("path")
				.data(data);
		entities.enter().append("path")
				.attr('d', this._map.geoPath)
				.classed('entity', true);
		
	}
	else if (this._type == 'point'){
		entities = this._g.selectAll("circle")
				.data(data);
		entities.enter().append("circle")
				.attr('cx', function(d){
					var point = d.geometry.coordinates;
					return projection(point)[0];
				})
				.attr('cy', function(d){
					var point = d.geometry.coordinates;
					return projection(point)[1];
				})
				.attr('vector-effect','non-scaling-stroke') //TODO: dealing with stroke width this way might not be optimal
				.classed('entity', true);
		
	}
	this.redraw();
}

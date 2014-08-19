var Cop = Cop || {};

Cop.map = function(id, config){
	var self = this;
	var active = d3.select(null);
	var mapdiv = d3.select('#' + id);
	this.tooltip = mapdiv.append('div').attr('id','maptooltip');
	this.config = config;
	this._layers = [];

	//var center = config.center;

	var width = document.getElementById('map').clientWidth, //Math.max(960, window.innerWidth),
		height = Math.max(1200,document.getElementById('map').clientHeight); //Math.max(500, window.innerHeight);

	var tile = d3.geo.tile()
    .size([width, height]);
    
	var projection = d3.geo.mercator()
		.scale((1 << 22) / 2 / Math.PI)
		.translate([width / 2, height / 2]);

	this.projection = projection;

	var center = projection(center || [5.870515,51.847913]);
	var geoPath = d3.geo.path()
		.projection(projection).pointRadius(function(d){
			return 10 / zoom.scale(); //is a constant
		});
	this.geoPath = geoPath;
	var zoom = d3.behavior.zoom()
		.scale(projection.scale() * 2 * Math.PI)
		.scaleExtent([1 << 10, 1 << 26])
		.translate([width - center[0], height - center[1]])
		.on("zoom", redraw);
	this.zoom = zoom;
	
	
    

	function clicked(d) {
		console.warn('Click not implemented');
	/*
	  if (active.node() === this) return self.reset();
	  active.classed("active", false);
	  active = d3.select(this).classed("active", true);

	  var bounds = self.geoPath.bounds(d),
		  dx = bounds[1][0] - bounds[0][0],
		  dy = bounds[1][1] - bounds[0][1],
		  x = (bounds[0][0] + bounds[1][0]) / 2,
		  y = (bounds[0][1] + bounds[1][1]) / 2,
		  scale = .9 / Math.max(dx / width, dy / height),
		  translate = [width / 2 - scale * x, height / 2 - scale * y];

	  svg.transition()
		  .duration(750)
		  .call(zoom.translate(translate).scale(scale).event);
	*/
	}
	this.clicked = clicked;
	function reset() {
	  active.classed("active", false);
	  active = d3.select(null);

	  svg.transition()
		  .duration(750)
		  .call(zoom.translate([0, 0]).scale(1).event);
	}
	this.reset = reset;



	function redraw() { 
		var tiles = tile
			.scale(zoom.scale())
			.translate(zoom.translate())
			();
			
		projection
            .scale(zoom.scale() / 2 / Math.PI)
            .translate(zoom.translate());
		//vector
		//	.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")")
		//	.style("stroke-width", 1 / zoom.scale())

		var image = raster
			.attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")")
			.selectAll("image")
			.data(tiles, function(d) { return d; });

		image.exit()
			.remove();

		image.enter().append("image")
		  .attr("xlink:href", function(d) { 
			//return "http://" + ["a", "b", "c", "d"][Math.random() * 4 | 0] + ".tiles.mapbox.com/v3/examples.map-vyofok3q/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; 
			//return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.stamen.com/watercolor/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
			return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".www.toolserver.org/tiles/bw-mapnik/" + d[2] + "/" + d[0] + "/" + d[1] + ".png";
		  })
		  .attr("width", 1)
		  .attr("height", 1)
		  .attr("x", function(d) { return d[0]; })
		  .attr("y", function(d) { return d[1]; });

		//redraw individual layers
		for (var i = 0; i < self.layers().length; i++){
			self.layers()[i].redraw();
		}
	}
	this.redraw = redraw;


	var svg = mapdiv.append("svg")
		.attr("width", width)
		.attr("height", height);
	this.svg = svg;
	var raster = svg.append("g").attr('id', 'raster');	
	var vector = svg.append("g").attr('id','vector');
	this.vector = vector;


}

/** 
	layers() - returns all layers
	layers(id) - returns specific layer or null
	layers(id, config) - creates a new layer, returns layer
**/
Cop.map.prototype.layers = function(id,config){
	if (!id){
		return this._layers;
	}
	else if (!config){
		//TODO: search for layer with id
	}
	else {
		this.svg.call(this.zoom);
		var layer = new Cop.layer(id, this, config);
		this._layers.push(layer);
		return layer;
	}
}

Cop.map.prototype.redraw = function(){
	this.svg.call(zoom);
	this.redraw();
}
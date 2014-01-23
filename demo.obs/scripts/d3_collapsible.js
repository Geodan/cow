function d3collapsible(layername, config){
        var f = {};
        var width, height,bottomLeft,topRight;
        
        var force = d3.layout.force()
            .size([width, height])
            .charge(-400)
            .linkDistance(40)
            .on("tick", tick);
        
        var drag = force.drag()
            .on("dragstart", dragstart);
       
		var link = svg.selectAll(".link"),
            node = svg.selectAll(".node");
        
		var g = svg.append("g");
		f.data = function(collection){
		    
			force
                  .nodes(collection)
                  .links(collection)
                  .start();
            
        }
       
		var tick = function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });
        
          node.attr("cx", function(d) { return d.x; })
              .attr("cy", function(d) { return d.y; });
        }
        var dragstart = function(d) {
          d.fixed = true;
          d3.select(this).classed("fixed", true);
        }
		
		return f;
}

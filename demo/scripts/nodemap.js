function nodeMap(el) {

    // Add and remove elements on the graph object
    this.addNode = function (id) {
        nodes.push({"id":id});
        update();
    }

    this.removeNode = function (id) {
        var i = 0;
        var n = findNode(id);
        while (i < links.length) {
            if ((links[i]['source'] == n)||(links[i]['target'] == n)) links.splice(i,1);
            else i++;
        }
        nodes.splice(findNodeIndex(id),1);
        //update();
    }

    this.addLink = function (source, target,dist) {
        links.push({"source":findNode(source),"target":findNode(target), "dist":dist});
        update();
    }
    
    this.removeLink = function(source, target) {
    	if (findLinkIndex(source, target) != null){
    		links.splice(findLinkIndex(source, target),1);
    		update();
    	}
    }
    
    this.updateLink = function(source, target, dist) {
    	if (findLinkIndex(source, target)){
    		var link = {"source":findNode(source),"target":findNode(target), "dist":dist};
    		links.splice(findLinkIndex(source, target),1,link);
    	}
    	else 
    	{
    		links.push({"source":findNode(source),"target":findNode(target), "dist":dist})
    	};
    	update();
    }
    

    var findNode = function(id) {
        for (var i in nodes) {
        	if (nodes[i].id == id) return nodes[i]
        };
    }

    var findNodeIndex = function(id) {
        for (var i in nodes) {
        	if (nodes[i].id == id) return i
        };
    }
    
    var findLinkIndex = function(sourceid, targetid) {
    	for (var i in links) {
    		if ((links[i].source && links[i].source.id == sourceid) && (links[i].target && links[i].target.id == targetid)) 
    			return i
    	};
    }

    // set up the D3 visualisation in the specified element
    var w = $(el).innerWidth(),
        h = $(el).innerHeight();

    var svg = this.svg = d3.select(el).append("svg:svg")
        .attr("width", w)
        .attr("height", h);

    // init force layout
    var force = d3.layout.force()
        .size([w, h])
        .nodes([{}]) // initialize with a single node
        .linkDistance(50)
        .charge(-20)
        .gravity(0.1);
        
    
    var nodes = force.nodes(),
        links = force.links(),
        node = svg.selectAll(".node"),
        link = svg.selectAll(".link");

    var update = function () {
    	var maxping = 2000;
    	var lineScale = d3.scale.linear()
    		.domain([0,maxping])
    		.range([10,1]);
    	var alphaScale = d3.scale.linear()
    		.domain([0,maxping])
    		.range([1,0]);
    	var colorScale = d3.scale.linear()
    		.domain([0,maxping])
    		.rangeRound([255,0]);

        var link = svg.selectAll("line.link")
            .data(links, function(d) { 
            	return d.source.id + "-" + d.target.id; }
            )
            .attr("stroke-width",function(d){
            		//return lineScale(d.dist);
            		return 2;
            })
            .style("stroke",function(d){
            		//return "rgba("+ (255 - colorScale(d.dist))+", " + colorScale(d.dist) +", 0,"+ alphaScale(d.dist)+")";
            		return "grey";
            });

        link.enter().insert("line")
            .attr("class", "link")
            .attr("stroke-width",function(d){
            		return lineScale(d.dist);
            })
            .style("stroke",function(d){
            		//console.log("rgba("+ (255 - colorScale(d.dist))+", " + colorScale(d.dist) +", 0,"+ alphaScale(d.dist)+")");
            		//return "rgba("+ (255 - colorScale(d.dist))+", " + colorScale(d.dist) +", 0,"+ alphaScale(d.dist)+")";
            		return "grey";
            		
            });

        link.exit().remove();

        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id;});

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            //.call(force.drag);

            nodeEnter.append("svg:circle")
            .attr("class", "circle")
            .attr("x", "-8px")
            .attr("y", "-8px")
            .attr("width", "16px")
            .attr("height", "16px")
            .attr("r", 10)
            .style("fill", function(d) {
            		if (core.UID && d.id == core.UID) return "blue";
            		return "none";
            })
            .style("stroke", "black");

        nodeEnter.append("text")
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em")
            .text(function(d) {return d.id});

        node.exit().remove();

        force.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        });

        // Restart the force layout.
        force.start();
    }

    // Make it all go
    update();
}



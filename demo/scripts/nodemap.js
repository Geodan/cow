//Example on adding/remove nodes and links: http://bl.ocks.org/mbostock/1095795

function nodeMap(el) {

                            
    
    // set up the D3 visualisation in the specified element
    var w = $(el).innerWidth(),
        h = $(el).innerHeight();

    var color = d3.scale.category10();
    var nodes = [],
    links = [];
    this.nodes = nodes;
    this.links = links;
    var svg = this.svg = d3.select(el).append("svg")
        .attr("width", w)
        .attr("height", h);
    
    var tick = function() {
      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
      //node.attr("transform", function(d) { 
      //      return "translate(" + d.x + "," + d.y + ")"; 
      //    });
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    }
    
    // init force layout
    var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .charge(-400)
    .linkDistance(80)
    .size([w, h])
    .on("tick", tick);
    this.force = force;    
    
    var node = svg.selectAll(".node"),
        link = svg.selectAll(".link");
    
    var start = function() {
      
      force.nodes(nodes);
      force.links(links);
      
      link = link.data(force.links(), function(d) { return d.source.id + "-" + d.target.id; });
      link.enter().insert("line", ".node")
        .attr("class", "link")
        .attr("id",function(d) { return d.target.id;});
      link.style('stroke','#dddddd');
      link.exit().remove();
    
      node = node.data(force.nodes(), function(d) { return d.id;});
      
      var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .call(force.drag);
      nodeEnter.append("circle")
        .attr("class", "circle")
        .attr("class", function(d) { return "node " + d.type; })
        .attr("id",function(d) { return d.id;})
        .attr("r", 8);
        
      nodeEnter.append("text")
        .attr("class", "nodetext")
        .attr("class", function(d) { return "node " + d.type; })
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) {return d.name});
      
      node.selectAll('text').text(function(d){return d.name;});
      node.exit().remove();
      
      force.start();
      d3.timer(force.resume);
    }
    this.start = start;
  
    
    var addLink = function(data){
        nodes.forEach(function(node){
            if (node.id == data.project){
                links.push({source: node, target: data});
            }
        });
    }
    
    var addNode = function(data){
        var isnew = true; 
        nodes.forEach(function(node){
            if (node.id == data.id){
                isnew = false;
                //Check if project has changed
                if (node.project != data.project){
                    node.project = data.project;
                    links.forEach(function(link,i){
                        if (link.target.id == data.id) links.splice(i,1);
                    });
                    addLink(node);
                }
                node.name = data.name;
            }
        });
        if (isnew && data.type == 'project'){
            nodes.push(data);
        }
        if (isnew && data.type == 'peer'){
            nodes.push(data);
            addLink(data);
        }
    }
    this.addNode = addNode;
    
    var clearNodes = function(){
        nodes = [];
        links = [];
    }
    this.clearNodes = clearNodes;
    
    var removeNode = function(data){
        nodes.forEach(function(node,i){
            if (node.id == data.id) nodes.splice(i,1);
        });
        
    }
    this.removeNode = removeNode;
    
    var updateNode = function(uid){
        /*
        var node = d3.select('circle#peer' + uid);
        if (node.length > 0){
            node.style('fill','red')
            .transition().duration(1000)
            .style('fill','#dddddd')
            ;
        }*/
    }
    this.updateNode = updateNode;
    
    var updateLink = function(uid){
        var line = d3.select('line#peer' + uid);
        if (line.length > 0){
            line.style('stroke','red')
            .style('stroke-width',3)
            .transition().duration(1000)
            .style('stroke','#dddddd')
            .style('stroke-width',1);
        }
    }
    this.updateLink = updateLink;
    
    
}



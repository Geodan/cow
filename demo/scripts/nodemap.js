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
      //node.attr("cx", function(d) { return d.x; })
      //    .attr("cy", function(d) { return d.y; })
      node.attr("transform", function(d) { 
            return "translate(" + d.x + "," + d.y + ")"; 
          });
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
      //node.enter().append("circle").attr("class", function(d) { return "node " + d.id; }).attr("r", 8);
      
      var nodeEnter = node.enter().append("g")
            .attr("class", "node")
      nodeEnter.append("circle")
        .attr("class", "circle")
        .attr("class", function(d) { return "node " + d.id; })
        .attr("id",function(d) { return d.id;})
        .attr("r", 8);
      nodeEnter.append("text")
        .attr("class", "nodetext")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) {return d.name});
      
      node.selectAll('.nodetext').text(function(d){return d.name;});
      node.exit().remove();
      //d3.timer(force.resume);
      force.start();
    }
    this.start = start;
    
/*    // 1. Add three nodes and three links.
    window.setTimeout(function() {
      var a = {id: 1377869343083}, b = {id: "b"}, c = {id: "c"};
      nodes.push(a, b, c);
      links.push({source: a, target: b}, {source: a, target: c}, {source: b, target: c});
      start();
    }, 0);
    // 2. Remove node B and associated links.
    setTimeout(function() {
      nodes.splice(1, 1); // remove b
      links.shift(); // remove a-b
      links.pop(); // remove b-c
      start();
    }, 3000);
    
    // Add node B back.
    setTimeout(function() {
      var a = nodes[0], b = {id: "b"}, c = nodes[1];
      nodes.push(b);
      links.push({source: a, target: b}, {source: b, target: c});
      start();
    }, 6000);
*/    

    var socketnode = {"id":'Socket', name: 'Socket'};
    nodes.push(socketnode);
    var addNode = function(data){
        var isnew = true;
        nodes.forEach(function(node){
            if (node.id == data.id){
                isnew = false;
                node.name = data.name;
            }
        });
        if (isnew){
            nodes.push(data);
            links.push({source: socketnode, target: data});
        }
    }
    this.addNode = addNode;
    
    var clearNodes = function(){
        nodes = [];
        links = [];
        nodes.push(socketnode);
    }
    this.clearNodes = clearNodes;
    
    var removeNode = function(data){
        nodes.forEach(function(node,i){
            if (node.id == data.id) nodes.splice(i,1);
        });
    }
    this.removeNode = removeNode;
    
    var updateNode = function(uid){
        var node = d3.select('circle#peer' + uid);
        if (node.length > 0){
            node.style('fill','red')
            .transition().duration(1000)
            .style('fill','#dddddd')
            ;
        }
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



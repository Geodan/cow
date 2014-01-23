//Example on adding/remove nodes and links: http://bl.ocks.org/mbostock/1095795

function nodeOverlay(svg,w,h) {
    var color = d3.scale.category10();
    
    var nodes = [],
    links = [];
    this.nodes = nodes;
    this.links = links;
    var treenodes = [];
    var  treelinks = [];
    var svg = svg;
    var _this = this;
    
    // Toggle children on click.
    var click = function(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      start();
    }
    
    // Returns a list of all nodes under the root.
    var flatten = function(root) {
      var nodes = [];
      root.forEach(function(d){
          function recurse(node) {
            if (node.children) node.children.forEach(recurse);
            nodes.push(node);
          }
          recurse(d);
        });
      return nodes;
    }
    
    
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
        //.nodes(nodes)
        //.links(links)
        .gravity(0)
        //.charge(-40)
        .linkDistance(50)
        .size([w, h])
        .on("tick", tick);
    this.force = force;    
    
    var node = svg.selectAll(".node"),
        link = svg.selectAll(".link");
    /* Mapdragtest. purpose is to get a dx dy after dragging the map so we can properly set the nodes
    var mapdrag = d3.behavior.drag()
        .origin(Object)
        .on("drag", dragmove);
    function dragmove(d) {
        console.log('dragged!');
      d3.select(this);
        //.etcetera      
    }    
    svg.call(mapdrag);
    */    
    var start = function() {
      //TREE TEST
      treenodes = flatten(nodes);
      treelinks = d3.layout.tree().links(treenodes);
      /////
      
      force.nodes(treenodes);
      force.links(treelinks);
      
      link = link.data(force.links(), function(d) { return d.source.id + "-" + d.target.id; });
      link.enter().insert("line", ".node")
        .classed("link", true)
        .attr("id",function(d) { return d.target.id;});
      //link.style('stroke','#dddddd');
      link.exit().remove();
    
      node = node.data(force.nodes(), function(d) { return d.id;});
      
      var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .each(function(d){console.log("node enter: " + d.id)});
      //Some fancy filtering, thanks to http://bl.ocks.org/cpbotha/5205319
      var defs = nodeEnter.append("defs");
      var filter = defs.append("filter")
        .attr("id", "drop-shadow")
        .attr("height", "150%")
        .attr("width", "150%")
        .attr("x", "-50%")
        .attr("y", "-50%");
        
      filter.append("feOffset")
        .attr("in", "SourceGraphic")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("result", "SourceOffset");
        
      filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 5)
        .attr("result", "blur");
        
      var feOffset = filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 5)
        .attr("dy", 5)
        .attr("result", "offsetBlur");
        
      var feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode")
        .attr("in", "offsetBlur")
      feMerge.append("feMergeNode")
        .attr("in", "SourceOffset");
            
      //nodeEnter.append("circle")
      //  .classed("circle",true)
      //  .classed("foo", function(d) { return "node " + d.type; })
      //  .attr("id",function(d) { return d.id;})
      //  .attr("r", 5)
      //  .on("click", click)
      //  .call(force.drag);
        
      nodeEnter.append("text")
        .classed("nodetext",true)
        .classed('foo',function(d) { return "node " + d.type; })
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) {return d.name});
      nodeEnter.append("image")
        .attr("xlink:href", function(d){
                if (d.imageurl) return d.imageurl;
                else return "./mapicons/stratego/stratego-flag.svg";
        })
        .classed("nodeimg",true)
        .attr("width", 50)
        .attr("height", 50)
        .attr("x",-25)
        .attr("y",-25)
        .on("click", click)
        .attr("filter", "url(#drop-shadow)")
        
        ;
      node.selectAll('text').text(function(d){return d.name;});
      node.exit().remove();
      force.start();
      d3.timer(force.resume);
    }
    this.start = start;
  
    var redraw = function(project){
        force.nodes(treenodes);
        force.links(treelinks);
        node = node.data(force.nodes(), function(d) { return d.id;});
        node.each(function(d){
            if (d.coords){
              d.px = project(d.coords)[0];
              d.py = project(d.coords)[1];
            }
            else {
               //d.px = d.px + _this.moved[0];
               //d.py = d.py + _this.moved[1];
            }
        });
        force.start();
        //d3.timer(force.resume);
    }
    this.redraw = redraw;
    
    var addLink = function(data){
        nodes.forEach(function(node){
            if (node.id == data.nucleus){
                links.push({source: node, target: data});
            }
        });
    }
    
    var addNode = function(data){
        var isnew = true; 
        nodes.forEach(function(node){
            if (node.id == data.id){
                isnew = false;
                //Check if nucleus has changed
                if (node.nucleus != data.nucleus){
                    node.nucleus = data.nucleus;
                    links.forEach(function(link,i){
                        if (link.target.id == data.id) links.splice(i,1);
                    });
                    addLink(node);
                }
                node.name = data.name;
            }
        });
        if (isnew && data.type == 'nucleus'){
            nodes.push(data);
        }
        if (isnew && data.type == 'satellite'){
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
        var line = d3.select('line#satellite' + uid);
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



//Replacing editpopup:
var cow = {};


cow.menu = function(feature,obj){
    var _this = this;
    var self = this.map;
    d3.selectAll('.popup').remove(); //Remove any old menu's
    var loc = d3.mouse(obj); //Wrong on firefox
    var divloc = [d3.event.screenX ,d3.event.screenY ];
    var item = self.core.itemstore().getItemById(feature.properties.key);
    var groups = self.core.project.groups();
    $.each(groups, function(i,d){
        d.children = [{name: 'Vw'},{name: 'Ed'},{name: 'Sh'}]
    });
    var data = {
     "name": "root",
     "children": [
      //{
      // "name": "P",
      // value: 5,
      // "children": groups
      //},
      {
          "name": "E",
          icon: './css/img/pencil_icon.png',
          label: 'Bewerken',
          value: 1
     },{
          "name": "D",
          icon: './css/img/clipboard_cut_icon.png',
          label: 'Verwijderen',
          value: 1
     },{
          "name": "T",
          icon: './css/img/text_letter_t_icon.png',
          label: "Tekst",
          size: 1
     },{
          "name": "S",
          icon: './css/img/share_2_icon.png',
          label: "Delen",
          size: 1
     }]
    };
    if (feature.geometry.type == 'Polygon'){
        data.children.push({
          "name": "Pop",
          icon: './css/img/users_icon.png',
          label: "Populatie",
          size: 1
        })
    }
        
    var width = 150;
    var height = 150;
    var radius = Math.min(width, height) / 2;
    var partition = d3.layout.partition()
        .sort(null)
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return d.value || 1; });
    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y * 0.7); })
        .outerRadius(function(d) {
            return Math.sqrt((d.y + d.dy)*1.5);
    });
    
    var color = d3.scale.category10();
    var entity = _this.g.append('g');

   if (entity.attr('selected') == 'true'){
    entity.select('.popup').remove();
    entity.attr('selected','false');
   }
   else {
    entity.attr('selected','true');
    
    var chart = entity.append('g')
        .classed('pie popup',true)
        .attr('width',width)
        .attr('height',height)
        .append('g')
        .attr('class','zoomable')
        .attr("transform", function(z){
            var x = loc[0];
            var y = loc[1];
            return "translate(" + x + "," + y + ")"
        });
     
     //var g = chart.selectAll('.arc1')
     var g = chart.datum(data).selectAll("arc1")
        .data(partition.nodes)
        .enter().append("g")
        .attr("class", "arc1")
        .on('click', function(d){
             d3.event.stopPropagation();//Prevent the map from firing click event as well
             var name = d.name;
             if (name == 'Pop'){
                 window.callback = function(d){
                     console.log(d);
                 }
                 d3.jsonp('http://model.geodan.nl/cgi-bin/populator/populator.py',function(){console.log(arguments)});
             }
             if (name == 'E'){ //edit geometry
                entity.remove();
                self.editLayer.addData(feature);
                self.editfeature(self,feature);
                
            }
            else if (name == 'T'){ //edit tekst
                entity.remove();
                var name = feature.properties.name || "";
                var desc = feature.properties.desc || "";
                var innerHtml = ''
                //+ translator.translate('Label') + ': <input id="titlefld" name="name" value ="'+name+'""><br/>'
                + translator.translate('Description') + ': <br> <textarea id="descfld" name="desc" rows="4" cols="25">'+desc+'</textarea><br/>'
                //+ '<button class="popupbutton" id="closeButton"">' + translator.translate('Done')+'</button>'
                + '';
                var div = d3.select('body').append('div')
                    .attr("height", 500)
                    .style('left',divloc[0]  -100 +  'px')
                    .style('top',divloc[1] + 0 + 'px')
                    .style('background-color','white')
                    .style('opacity',0.7)
                    .style('position','absolute');
                    div.append('div').attr("width", 480)
                    
                    .html(innerHtml);
                    div.append('div')
                        .html(translator.translate('Done'))
                        .classed('popupbutton', true)
                        .on('click',function(z){
                                self.changeFeature(self, feature);
                                div.remove();
                        });
            }
            else if (name == 'S'){//Share permissions
                entity.remove();
                
                var mygroups = self.core.project.myGroups();
                var groupnames = "";
                $.each(mygroups,function(i,d){
                    groupnames = groupnames + self.core.project.getGroupById(d).name;
                });
                
                var allgroups = self.core.project.groups();
                var form = '';
                $.each(allgroups, function(i,d){
                        var checked = '' ;
                        if (item.permissionHasGroup('edit',[d._id])) checked = 'CHECKED';
                        
                            form = form + '<input type="checkbox" '+checked+' class="share-'+d.name+'"><span class="group '+d.name+'" title="'+d.name+'"></span>'+d.name+'<br>';
                });
                var div = d3.select('body').append('div')
                    .style('left',divloc[0]  -100 +  'px')
                    .style('top',divloc[1] + 0 + 'px')
                    .classed("popup share ui-draggable", true);
                var sheader = div.append('div')
                    .classed('sheader', true)
                    .attr('title','Dit object is gemaakt door');
                sheader.append('span')
                    .classed('group populatie',true); //TODO add own groups here
                sheader.append('span').html(groupnames);
                var scontent = div.append('div')
                    .classed('scontent', true);
                scontent.append('div').classed('ssubheader', true).html('deel dit object met:');
                scontent.append('div').classed('idereen',true).html('<input type="checkbox" class="share-cop"><span class="group cop" title="COP"></span>Iedereen');
                var formbox = scontent.append('div').classed('individueel',true);
                formbox.html(form);
                
            }
            else if (name == 'D'){//Delete feature
                entity.remove();
                self.deletefeature(self,feature);
            }   
        })
        .on('mouseover', function(d){ //Mouseover menulabel
            d3.select(this)
             .style('opacity',0.5)
             .append("text")
              .classed('menu',true)
              //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
              .attr("dy", 0)
              .attr("dx", 0)
              .style("text-anchor", "middle")
              .text(function(d) { 
                      return d.label; 
              });
        })
        .on('mouseout', function(d){
            d3.select(this)
                .style('opacity',1)
                .selectAll('text').remove();
        });
        
    g.append("path")
        .attr("d", function(d){
            return arc(d);
        })
        .style("stroke", "#fff")
        .style("fill", function(d) {
            if (d.name == 'root') 
                return 'none';
            else if (d.parent && d.parent.name == 'P')
                return 'none';
            else if (d.parent && d.parent.name == 'root')
                return color(d.name);
            else 
                return color(d.name);
        })
        
        
    g.append("svg:image")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
       .attr('x',-9)
       .attr('y',-12)
       .attr('width', 20)
       .attr('height', 24)
       .attr("xlink:href",function(d){
               return d.icon;
       })
    //g.append("text")
    //  .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
    //  .attr("dy", ".35em")
    //  .style("text-anchor", "middle")
    //  .text(function(d) { 
    //          return d.name; 
    //  });
   }
   
      
      
  }

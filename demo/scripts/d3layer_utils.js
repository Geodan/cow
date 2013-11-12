//Replacing editpopup:
var cow = {};
cow.textbox = function(feature,obj){
    var _this = this;
    var self = this.map;
    //d3.selectAll('.popup').remove(); //Remove any old menu's
    d3.select(obj).on('mouseout', function(d){
          d3.selectAll('.textbox').remove();
    });
    var loc = d3.mouse(obj); //Wrong on firefox
    var divloc = [d3.event.screenX ,d3.event.screenY ];
    var item = self.core.itemstore().getItemById(feature.properties.key);
    var name = feature.properties.name || "";
    var desc = feature.properties.desc || "";
    var ownername = feature.properties.owner || "Anoniem";
    //var mygroups = self.core.project.myGroups();
    var editgroups = item.permissions('edit')[0].groups;
    var groupnames = "";
    $.each(editgroups,function(i,d){
        var name = self.core.project.getGroupById(d).name;
        if (name != 'public') //Keep public out of here
            groupnames = groupnames + name; 
    });
    
    var allgroups = self.core.project.groups();
    var grouparr = [];
    $.each(allgroups, function(i,d){
            grouparr.push(d._id);
    });
    
    var div = d3.select('body').append('div')
        .style('left',divloc[0] + 25 +  'px')
        .style('top',divloc[1] + -100 + 'px')
        .classed("textbox popup share ui-draggable", true);
    var sheader = div.append('div')
        .classed('sheader', true)
        .attr('title','Dit object is gemaakt door');
    sheader.append('span')
        .classed('group ' + groupnames,true); //TODO add own groups here
    sheader.append('span').html(groupnames  + " <small>(" + ownername + ")</small>");
    var scontent = div.append('div')
        .classed('scontent', true);
    desc = desc.replace(/\r\n?|\n/g, '<br />');
    scontent.append('div').classed('ssubheader', true).html(desc);
    sfooter = div.append('div')
        .classed('sfooter',true)
        .attr('id','permissionlist')
        .html("Gedeeld met:");//TODO dont use ids;
    var itemgroups = item.permissions('view')[0].groups;
    var blokje = d3.select('#permissionlist').selectAll('.permission').data(itemgroups);
    blokje.enter()
        .append('span')
        .attr('class',function(d){
            var groupname = self.core.project.getGroupById(d).name
            return 'group ' + groupname;
        });
        
}

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
    if (feature.geometry.type == 'Polygon' && self.core.project.myGroups().indexOf(2) > -1){
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
        .on('dblclick',function(d){
            d3.event.stopPropagation();//Prevent the map from firing click event as well
            var name = d.name;
            if (name == 'D'){//Delete feature without asking
                entity.remove();
                self.deletefeature(self,feature);
            }
        })
        .on('click', function(d){
             d3.event.stopPropagation();//Prevent the map from firing click event as well
             var name = d.name;
             if (name == 'Pop'){
                 window.callback = function(d){
                    entity.remove();
                    var population = "Populatie: \n" ;
                    var wonen= werken= onderwijs= zorg = 0;
                    $.each(d.results,function(i,d){
                            if (d.doel == 'onderwijsfunctie'){
                                onderwijs = onderwijs + (d.count * 200);
                            }
                            else if (d.doel == 'kantoorfunctie' || d.doel == 'industriefunctie' || d.doel == 'winkelfunctie'){
                                werken = werken + (d.count * 10);
                            }
                            else if (d.doel == 'gezondheidszorgfunctie'){
                                zorg = zorg + (d.count * 50);
                            }
                            else if (d.doel == 'woonfunctie'){
                                wonen = wonen + Math.round(d.count * 2.3);
                            }
                    });
                    population = 'Populatie: \n WONEN: ' + wonen + ' pers.\n'
                            + ' WERKEN: ' + werken + ' pers. \n'
                            + ' ZORG: ' + zorg + ' pers. \n'
                            + ' ONDERWIJS: ' + onderwijs + ' pers. \n';

                    
                    //Doing the same as for text edit
                    var name = feature.properties.name || "";
                    //var desc = (feature.properties.desc || "") + population; 
                    var desc = population; //Replace original text
                    var innerHtml = ''
                    //+ translator.translate('Label') + ': <input id="titlefld" name="name" value ="'+name+'""><br/>'
                    + 'Description: <br> <textarea id="descfld" name="desc" rows="6" cols="25">'+desc+'</textarea><br/>'
                    //+ '<button class="popupbutton" id="closeButton"">' + translator.translate('Opslaan')+'</button>'
                    + '';
                    var div = d3.select('body').append('div')
                    .style('left',divloc[0] + 0 +  'px')
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
                desc = desc.replace(/\r\n?|\n/g, '<br />');
                scontent.append('div').classed('ssubheader', true).html(innerHtml);
                scontent.append('div')
                        .html('Opslaan')
                        .classed('popupbutton', true)
                        .on('click',function(z){
                                self.changeFeature(self, feature);
                                div.remove();
                        });
                sfooter = div.append('div')
                    .classed('sfooter',true)
                    .attr('id','permissionlist');//TODO dont use ids;
                var itemgroups = item.permissions('view')[0].groups;
                var blokje = d3.select('#permissionlist').selectAll('.permission').data(itemgroups);
                blokje.enter()
                    .append('span')
                    .attr('class',function(d){
                        var groupname = self.core.project.getGroupById(d).name
                        return 'group ' + groupname;
                    });
                    }
                    //Will generate a callback to 'callback'
                    var geom = JSON.stringify(feature.geometry);
                    d3.jsonp('http://model.geodan.nl/cgi-bin/populator/populator.py?geom=' + geom,function(){console.log(arguments)});
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
                + 'Description: <br> <textarea id="descfld" name="desc" rows="6" cols="25">'+desc+'</textarea><br/>'
                //+ '<button class="popupbutton" id="closeButton"">' + translator.translate('Opslaan')+'</button>'
                + '';
                
                var div = d3.select('body').append('div')
                    .style('left',divloc[0] + 0 +  'px')
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
                desc = desc.replace(/\r\n?|\n/g, '<br />');
                scontent.append('div').classed('ssubheader', true).html(innerHtml);
                scontent.append('div')
                        .html('Opslaan')
                        .classed('popupbutton', true)
                        .on('click',function(z){
                                self.changeFeature(self, feature);
                                div.remove();
                        });
                sfooter = div.append('div')
                    .classed('sfooter',true)
                    .attr('id','permissionlist');//TODO dont use ids;
                var itemgroups = item.permissions('view')[0].groups;
                var blokje = d3.select('#permissionlist').selectAll('.permission').data(itemgroups);
                blokje.enter()
                    .append('span')
                    .attr('class',function(d){
                        var groupname = self.core.project.getGroupById(d).name
                        return 'group ' + groupname;
                    });
                /*
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
                        .html('Opslaan')
                        .classed('popupbutton', true)
                        .on('click',function(z){
                                self.changeFeature(self, feature);
                                div.remove();
                        });
                 */
            }
            else if (name == 'S'){//Share permissions
                entity.remove();
                
                var mygroups = self.core.project.myGroups();
                var groupnames = "";
                $.each(mygroups,function(i,d){
                    groupnames = groupnames + self.core.project.getGroupById(d).name;
                });
                
                var allgroups = self.core.project.groups();
                var grouparr = [];
                $.each(allgroups, function(i,d){
                        
                        grouparr.push(d._id);
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
                scontent.append('div').classed('iedereen',true).append('div')
                    .attr('class','permission share-cop unselected')
                    .on('click',function(d){
                        //Only adding permissions here, removing goes 1 by 1
                        item.permissions('view',grouparr);
                        core.itemstore().items('feature',{data:item.flatten()},'user');
                        d3.selectAll('.permission').attr('class','selected');
                        console.log('Permissions for all groups added');
                    })
                    .html('<span class="group cop" title="COP"></span>Iedereen');
                
                var formbox = scontent.append('div').classed('individueel',true).attr('id','permlist');
                var permissions = d3.select('#permlist').selectAll('.permission').data(allgroups);
                //Add on/off button for every group
                var pdiv = permissions.enter().append('div')
                        .attr('class',function(d){
                            if (item.permissionHasGroup('view',[d._id])) return 'permission selected';
                            else return 'permission unselected';
                        })
                        .on('click',function(d){
                            if (d3.select(this).classed('unselected')){
                                d3.select(this).classed('selected',true).classed('unselected',false);
                                item.permissions('view',d._id);
                                core.itemstore().items('feature',{data:item.flatten()},'user');
                                console.log('Permission added');
                            }
                            else {
                                d3.select(this).classed('unselected',true).classed('selected',false);
                                item.removePermission('view',[d._id]);
                                core.itemstore().items('feature',{data:item.flatten()},'user');
                                console.log('Permission removed');
                            }
                        });
                    pdiv.append('span').attr('class',function(d){
                                return 'group ' + d.name;
                        });
                    pdiv.append('span')
                        .html(function(d){return d.name});
                scontent.append('div')
                        .html('Sluiten')
                        .classed('popupbutton', true)
                        .on('click',function(z){
                                //Close share window, 
                                div.remove();
                        });
                //formbox.html(form);
                
            }
            else if (name == 'D'){//Delete feature
                if (confirm('Verwijderen?')) {
                    entity.remove();
                    self.deletefeature(self,feature);
                } else {
                    // Do nothing!
                }
                

            }   
        })
        .on('mouseover', function(d){ //Mouseover menulabel
            d3.select(this)
                 .append("text")
                  .classed('menu_shadow',true)
                  //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                  .attr("dy", 0)
                  .attr("dx", 0)
                  .text(function(d) { 
                          return d.label; 
                  });
            d3.select(this)
             .append("text")
              .classed('menu',true)
              //.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
              .attr("dy", 0)
              .attr("dx", 0)
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

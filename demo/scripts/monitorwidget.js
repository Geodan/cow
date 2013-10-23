(function($) {
$.widget("cow.MonitorWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
    heartbeats: function(beats){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getHeartbeats();
        case 1:
            return this._addHeartbeats(beats);
        default:
            throw('wrong argument number');
        }
    },
    _getHeartbeats: function() {
        var data = [
            {
                "key": "Activity",
                "values":  this._beats
            }
        ];
        return data;
    },
    _addHeartbeats: function(beats) {
        var t = new Date().getTime();
        var obj = [t, beats];
        if (!this._beats) this._beats = [];
        if (this._beats.length > 20) this._beats.shift();
        this._beats.push(obj);
        return beats;
    },
    _create: function() {
        var core;
        var self = this;
        this.events = $({});
        var element = this.element;
        this.beats = 0;
        core = $(this.options.core).data('cow');
        this.core=core;
        
        core.bind("ws-connected", {widget: self}, self._onConnect);
        core.bind("ws-disconnected", {widget: self}, self._onDisConnect);
        core.bind("ws-peerInfo",{widget: self},self._updateList);
        core.bind("ws-newPeer",{widget: self},self._updateList);
        core.bind("ws-peerGone",{widget: self},self._onPeerGone);
        core.bind("peerStoreChanged",{widget: self},self._updateList);
        core.bind("projectListChanged", {widget: self},self._updateList);        
        
		element.html("<div id='nodemap'></div><div id='heartbeat'><svg></svg></div>");
		//Init nodemap
		this.nodemap = new nodeMap("#nodemap");
		
		//Init heartbeat
		nv.addGraph(function() {
          var chart = nv.models.lineChart()
                        .x(function(d) { return d[0] })
                        .y(function(d) { return d[1] }) 
                        .color(d3.scale.category10().range());
          
          chart.xAxis
              .tickFormat(function(d) {
                 return d3.time.format('%X')(new Date(d))
               });
     
         chart.yAxis
             .tickFormat(d3.format('f,f'));
             
         d3.select('#heartbeat svg')
                 .datum(self.heartbeats())
               .transition().duration(500)
                 .call(chart);
         nv.utils.windowResize(chart.update);
        self.chart = chart; 
         return chart;
       });
        
		
		
		self.heartbeats(1);
		window.setInterval(function(){
            self.heartbeats(self.beats);
            self.beats = 0;
            d3.select('#heartbeat svg').datum(self.heartbeats())
				.transition().duration(100)
				.call(self.chart);
		},2000);
		
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onConnect: function(evt) {
		var self = evt.data.widget;
		//var socketnode = {"id":'Socket', name: 'Socket'};
		//self.nodemap.addNode(socketnode);
		
		//Everytime we connect, create a new listener to the ws element (because the old listener died with the ws)
        core.websocket().ws.addEventListener("message",function(evt){
          var data = JSON.parse(evt.data);
          //Add heartbeat info
          self.beats = self.beats + evt.data.length;
          
          //Show how the data prolongates in nodemap
          self.nodemap.updateLink(data.uid);
          self.nodemap.updateNode(data.uid);
          tmp = self.nodemap;
          //
        });  
		
	},
	_onPeerInfo: function(evt){
	    var self = evt.data.widget;
	    core.peers().forEach(function(peer){
	       var node = {id: "peer" + peer.uid, name: peer.owner().name};
	       self.nodemap.addNode(node);
		});
		self.nodemap.start();
	},
	_onPeerUpdate: function(evt,payload){
	    var self = evt.data.widget;
	    var uid = payload.uid;
	    core.peers().forEach(function(peer){
	       var node = {id: "peer" + peer.uid, name: peer.owner().name};
	       self.nodemap.addNode(node);
		});
		self.nodemap.start();
	    
	},
	_onProjectListChanged: function(evt, payload){
	    console.log('projectlistchanged: ' + payload);
	},
	_onDisConnect: function(evt) {
		var self = evt.data.widget;
		self.nodemap.clearNodes();
		self.nodemap.start();
	},
	_onPeerGone: function(evt, payload){
	    var self = evt.data.widget;
	    self.nodemap.clearNodes();
	    self._updateList(evt);
	},
	_updateList: function(evt){
	    var self = evt.data.widget;
	    var peers = self.core.peers();
        var projects = [];
        $.each(self.core.projects(),function(i) {
            projects[i] = {};
            projects[i].uid = this.uid;
            projects[i].name = this.options.name;
            projects[i].active = this.options.active;
            projects[i].peers = this.members();
        });
        $.each(projects,function() {
            var project = this;
            if (project.active){
                var projectnode = {
                    id: "project" + project.uid, 
                    name: this.name, 
                    type: 'project'
                };
                self.nodemap.addNode(projectnode);
                $.each(this.peers, function(i){
                   var peer = self.core.getPeerByUid(project.peers[i]);
                   if (peer){
                       var node = {
                            id: "peer" + peer.uid, 
                            name: peer.owner().name,
                            project: "project"  + project.uid, 
                            type: 'peer'
                       };
                       self.nodemap.addNode(node);
                   }
                });
            }
        });
	    self.nodemap.start();
	},
	});
})(jQuery);
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
                "key": "Heartbeat",
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
        var element = this.element;

        core = $(this.options.core).data('cow');
        core.bind("ws-connected", {widget: self}, self._onConnect);
        core.bind("ws-disconnected", {widget: self}, self._onDisConnect);
        core.bind("peerStoreChanged",{widget: self},self._onPeerInfo);
        core.bind("ws-peerGone",{widget: self},self._onPeerGone);
        
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
        
		
		self.beats = 0;
		self.heartbeats(1);
		window.setInterval(function(){
            self.heartbeats(self.beats);
            self.beats = 0;
            d3.select('#heartbeat svg').datum(self.heartbeats())
				.transition().duration(100)
				.call(self.chart);
		},10000);
		
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onConnect: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
        self.nodemap.addNode(core.UID);
		core.peers().forEach(function(peer){
		        self.nodemap.addNode(peer.uid);
		        //self.nodemap.addLink(peer.uid, core.UID, 1);
		});
	},
	_onDisConnect: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
	},
	_onPeerInfo: function(evt) {
	    var self = evt.data.widget;
	    self.beats = self.beats + 5;
	    core.peers().forEach(function(peer){
		        self.nodemap.addNode(peer.uid);
		        //self.nodemap.addLink(peer.uid, core.UID, 1);
		        
		});
	},
	_onPeerGone: function(evt){
	    console.log(evt);
	}
	});
})(jQuery);
/*$.Cow.ConnectWidget = {
init: function(){
var widget = $('#connect');
var cow = $('#cow').data('cow');
cow.events.bind('connected',{}, this._onConnect);
},
_onConnect: function() {
}
}
*/
(function($) {
$.widget("cow.PeersWidget", {
	options: {
        // The cow.core instance
        core: undefined,
		name: '#myname'
    },
 _create: function() {
        var core;
        var self = this;		
        var element = this.element;

        core = $(this.options.core).data('cow');
		this.core=core;
        core.bind("ws-connected", {widget: self}, self._onConnect);
		core.bind("ws-disconnected", {widget: self}, self._onDisconnect);
		core.bind("ws-peerGone", {widget: self}, self._onPeerGone);
        core.bind("peerStoreChanged" ,{widget: self}, self._onPeerStoreChanged);
        /* SMO: obs? 8/8/13
		core.bind("peerInfo", {widget: self}, self._onPeerInfo);
		core.bind("newPeer", {widget: self}, self._onNewPeer);
		core.bind("peerupdated", {widget: self}, self._onPeerUpdated);
		core.bind("changeHerdRequest", {widget: self}, self._updateList);
        */
		
		element.delegate('.location','click', function(){
			var owner = $(this).attr('owner');
			var peer = core.getPeerByUid(owner);
			var location = peer.options.position;
			self.core.trigger('zoomToPeerslocationRequest', location);
		});
		
		element.delegate('.extent','click', function(){
			var owner = $(this).attr('owner');
			var peer = core.getPeerByUid(owner);
			var bbox = peer.extent();
			self.core.trigger('zoomToPeersviewRequest', bbox);
		});
		
		//Preliminary peerjs video connection
		element.delegate('.videoconnection','click', function(){
            var owner = $(this).attr('owner');
            $('#videopanel').add("button").on("click",function(e){
                console.log("Closing "  + owner);
                self.peer1.managers[owner].close();
                $('#videopanel').hide();
            });
            
            $('#videopanel').show();
            
            mc = self.peer1.call(owner, ls);
            tmp = self.peer1;
            mc.on('stream', function(s){
                window.remote = s;
                  z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('#videoplace');
              });
            
         });
		
		element.delegate('.herd','click', function(){
			var herd = $(this).attr('herd');
			self.core.trigger('changeHerdRequest', herd);
			
		});
		
		$(this.options.name).change(function(){
            self.core.me().owner({"name":$(this).val()});
			
		});

    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	
	_onConnect: function(evt) {
	console.log('_onConnect');
		var self = evt.data.widget;
		self._updateList(evt);
	/*	
	//Doing some preliminary peerjs stuff..
	navigator.webkitGetUserMedia({audio: true, video: true}, function(s){
      window.ls = s;
      // Create a new Peer with our demo API key, with debug set to true so we can
      // see what's going on.
      self.peer1 = new Peer(self.core.UID, { key: 'lwjd5qra8257b9', debug: true });
      
      self.peer1.on('call', function(c){
        
        c.answer(s);
        c.on('stream', function(s){
          $('#videopanel').show();
          window.s = s;
          z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('#videoplace');
          
        });
        c.on('close', function(x){
             console.log('Video connection closed');
             $('#videopanel').hide();
        });
      });
    }, function(){});
	*/	
		
	},
	_onDisconnect: function(evt) {
        console.log('_onDisconnect');
		var self = evt.data.widget;
		self._updateList(evt);
		//Peerjs stuff
		if (self.peer1)
		    self.peer1.destroy();
	},
	_onPeerGone: function(evt) {
	console.log('_onPeerGone');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	_onPeerInfo: function(evt) {
		console.log('_onPeerInfo');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	_onPeerStoreChanged: function(evt) {
	console.log('_onNewPeer');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	
	_updateList: function(evt) {		
		var self = evt.data.widget;
		var peers = self.core.peers();
		var herds = self.core.herds();
        var element = self.element;
        
		
        var names = '';
		$.each(peers,function(){
			if(this.uid==self.core.UID) {
			names = names+ '<span class="peerlist me" title="this is you!" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png"></span></br>';
			}
			else {
			names = names+ '<span class="peerlist owner" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png">&nbsp;<img class="extent" owner="'+this.uid+'" src="./css/img/extents.png">&nbsp;<img class="videoconnection" owner="'+this.uid+'" src="./css/img/camera.png"></span></br>';
			}
		});
		names = names + "<h2>Herds</h2>";
		$.each(herds,function(){
		    //TODO: make sure this works when we have no me() peer
		    if(self.core.me().herd() && this.uid==self.core.me().herd().uid) {
		        names = names + '<span class="peerlist me" title="this is your herd" herd="'+this.uid+'">'+this.name+'</span></br>';
		    }
		    else {
		        names = names + '<span class="peerlist herd" title="click to activate this herd" herd="'+this.uid+'">'+this.name+'</span></br>';
		    }
		});
		element.html(names);
		
	}
	});
})(jQuery);



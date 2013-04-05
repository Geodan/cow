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

        //get the mapquery object
        core = $(this.options.core).data('cow');
		this.core=core;
        core.bind("connected", {widget: self}, self._onConnect);
		core.bind("disconnected", {widget: self}, self._onDisconnect);
		core.bind("peerGone", {widget: self}, self._onPeerGone);
		core.bind("peerInfo", {widget: self}, self._onPeerInfo);
		core.bind("newPeer", {widget: self}, self._onNewPeer);
		core.bind("peerupdated", {widget: self}, self._onNewPeer);
		element.delegate('.owner','click', function(){
			var owner = $(this).attr('owner');
			var peer = core.getPeerByUid(owner);
			var bbox = peer.extent();
			self.core.map.zoomToExtent([bbox.left,bbox.bottom,bbox.right,bbox.top]);
		});
		$(this.options.name).change(function(){self._updateName({data:{widget: self,name: $(this).val()}})});

    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_updateName:function(evt){
		var self = evt.data.widget;
		var name = evt.data.name;
		self.core.me().options.owner =name;
		self._updateList(evt);
	},
	_onConnect: function(evt) {
	console.log('_onConnect');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	_onDisconnect: function(evt) {
	console.log('_onDisconnect');
		var self = evt.data.widget;
		self._updateList(evt);
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
	_onNewPeer: function(evt) {
	console.log('_onNewPeer');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	_updateList: function(evt) {		
		var self = evt.data.widget;
		var peers = self.core.peers();
        var element = self.element;
		var names = '';
		
		$.each(peers,function(){
			if(this.uid==self.core.UID) {
			names = names+ '<span class="peerlist me" title="this is you!" owner="'+this.uid+'">'+this.options.owner+'</span></br>';
			}
			else {
			names = names+ '<span class="peerlist owner" title="click to see this peers view" owner="'+this.uid+'">'+this.options.owner+'</span></br>';
			}
		});
		element.html(
			names
		);
		
	}
	});
})(jQuery);



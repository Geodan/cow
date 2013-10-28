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
$.widget("cow.FeaturesWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
 _create: function() {
        var core;
        var self = this;		
        var element = this.element;

        core = $(this.options.core).data('cow');
		this.core=core;
        core.bind("dbloaded", {widget: self}, self._onLoaded);
		//core.bind("disconnected", {widget: self}, self._onDisconnect);
		//core.bind("peerGone", {widget: self}, self._onPeerGone);
		//core.bind("peerInfo", {widget: self}, self._onPeerInfo);
		//core.bind("newPeer", {widget: self}, self._onNewPeer);
		core.bind("storeChanged", {widget: self}, self._onLoaded);
		 
		element.delegate('.owner','click', function(){
			var key = $(this).attr('owner');
			self.core.itemstore().removeItem(key);
			self.core.trigger('storeChanged');
			//controls.select.activate();
			//TODO TT: auw, we moeten een fid proberen toe te kennen
			//var feature = core.editLayer.getFeaturesByAttribute(key)[0];
			//controls.select.select(feature);
		});
		//$(this.options.name).change(function(){self._updateName({data:{widget: self,name: $(this).val()}})});
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onLoaded: function(evt) {
		//console.log('_onLoaded');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	_onNewItem: function(evt) {
		//console.log('_onNewFeature');
		var self = evt.data.widget;
		self._updateList(evt);
	},
	_updateList: function(evt) {		
		var self = evt.data.widget;
        //TODO: items()
		var items = core.itemstore().items();		//TT: we only use 1 store anyway... 
        var element = self.element;
		var names = '';
		
		$.each(items,function(){
				var item = this._data;
				names = names+ '<span owner="'+this._id+'" class="peerlist owner '+ this.status() +'" title="'
					+ ' key:  '+this._id
					+ '\n status: '+ this.status()
					+ '\n updated: '+ this.timestamp() 
					+ '\n Click to change status">'+this.status()+this._id+'</span></br>';
		});
		name = names + '<br><hr>Purge local storage <button onclick="purgeLocaldb">Purge</button>';
		element.html(
			names
		);
		
	}
	});
})(jQuery);



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
$.widget("cow.ConnectWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
 _create: function() {
        var core;
        var self = this;
        var element = this.element;

        //get the mapquery object
        core = $(this.options.core).data('cow');

     

        core.bind("ws-connected", {widget: self}, self._onConnect);
        core.bind("ws-disconnected", {widget: self}, self._onDisConnect);
		
		element.delegate('.disconnect','click', function(){
			try {//TODO: This should be a trigger instead of directly calling the websocket
				core.websocket().closews();
			}
			catch(err){
				console.warn(err);
			}
		});
		/*element.delegate('.connect','click', function(){
			//core.websocket().openws(core.options.websocket.url);	
		})*/;
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onConnect: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.addClass('connected').removeClass('disconnected');
		element.html(
			'<span class="disconnect">' + translator.translate('txt_connected') + '</span>'
		);
		
	},
	_onDisConnect: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.addClass('disconnected').removeClass('connected');
		element.html(
			'<span class="connect">' + translator.translate('txt_disconnected') + '</span>'
		);
		
	}
	});
})(jQuery);
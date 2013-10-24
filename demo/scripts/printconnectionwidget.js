
(function($) {
$.widget("cow.PrintConnectionWidget", {
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

		//bind triggers to individual functions.
        core.bind("ws-connected", {widget: self}, self._onConnect);
        core.bind("ws-disconnected", {widget: self}, self._onDisConnect);
		
		var w = (core.websocket().ws !== null);
		
		if (w === true) {
			element.addClass('iamconnected').removeClass('iamdisconnected');
			element.html('<div class="myconnection" data-i18n="txt_connected">' + translator.translate('txt_connected') + '</div>');
		} else {
			element.addClass('iamdisconnected').removeClass('iamconnected');
			element.html('<div class="myconnection" data-i18n="txt_disconnected">' + translator.translate('txt_disconnected') + + '</div>');
		}
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onConnect: function(evt) {
        var element = evt.data.widget.element;
		element.addClass('iamconnected').removeClass('iamdisconnected');
		element.html('<div class="myconnection" data-i18n="txt_connected">' + translator.translate('txt_connected') + '</div>');
	},
	_onDisConnect: function(evt) {
        var element = evt.data.widget.element;
		element.addClass('iamdisconnected').removeClass('iamconnected');
		element.html('<div class="myconnection" data-i18n="txt_disconnected">' + translator.translate('txt_disconnected') + + '</div>');
	}
	});
})(jQuery);

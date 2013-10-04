(function($) {
$.widget("cow.HelpWidget", {
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
		this.core=core;
		
		var html = '<div class="namearrow"><img src="css/img/arrow.png"/><span class="text">' + translator.translate('txt_changenamehere') + '</span></div>';
		element.html(
		html
		);
		element.find('.namearrow').show('fade','slow').effect('bounce',{distance: -30,easing:'linear'},1500).delay(2000).hide('fade');
		core.bind("disconnected", {widget: self}, self._onDisconnect);
		},
	_onDisconnect: function(evt) {
		var self = evt.data.widget;
		var element = self.element;
		var html = '<div class="disconnectarrow"><img src="css/img/arrow.png"/><div><span class="text">' + translator.translate('txt_changenamehere') + '</span></div></div>';
		element.html(html);
		element.find('.disconnectarrow').show('fade','slow').effect('bounce',{distance: -30,easing:'linear'},1500).delay(2000).hide('fade');
	}
	});
})(jQuery);

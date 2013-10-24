
(function($) {
$.widget("cow.PrintLocationWidget", {
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
		core.bind("myPositionChanged" ,{widget: self}, self._onMyPositionChanged);
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onMyPositionChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getLocationString(evt));
	},
	_getLocationString: function(evt) {
		var point = core.me().position().point;
        var string = "";
        string = '<div class="locationItem">' + '<div class="locationTimestamp"> Timestamp: ' + point.time + '</div>' +
				 '<div class="locationCoords"> Latitude: ' + point.coords.latitude + '\t Longitude: ' + point.coords.longitude + '</div>' + '</div>'
        return string;
    }
	});
})(jQuery);

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
$.widget("cow.NewFeatureWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
 _create: function() {
        var core;
        var self = this;		
        var element = this.element;
        var current_icon;
        core = $(this.options.core).data('cow');
		this.core=core;

		/* Listeners to be found in olmapwidget */ 		
		element.delegate('.newpoint','click', function(){
        	var key = $(this).attr('newpoint');
        	self.element.trigger("newpoint", key);
		});
		element.delegate('.newline','click', function(){
        	var key = $(this).attr('newline');
        	self.element.trigger("newline", key);
		});
		element.delegate('.newpoly','click', function(){
        	var key = $(this).attr('newpoly');
        	self.element.trigger("newpoly", key);
		});
		
        var names = translator.translate('txt_drawhelp');
        names = names+ '<p><b>'+ translator.translate('txt_markericons') + '</b><div class=/>';
        names = names + '<div id="icons"></div>'; //Icons will be inserted here after loading
        names = names + '<div class="peerlist linediv">';
        names = names + '<b>'+ translator.translate('txt_linecolors') + '</b><br/>';
        names = names + '</div>';
        names = names + '<span newline="black" class="peerlist newline" title="Black line"><hr color="black"></span>';
        names = names + '<span newline="#204a87" class="peerlist newline" title="Blue line"><hr color="#204a87"></span>';
        names = names + '<span newline="#f57900" class="peerlist newline" title="Orange line"><hr color="#f57900"></span>';
        names = names + '<span newline="#cc0000" class="peerlist newline" title="Red line"><hr color="#cc0000"></span>';
        names = names + '<span newline="#5c3566" class="peerlist newline" title="Purple line"><hr color="#5c3566"></span>';	
        names = names + '<span newline="#4e9a06" class="peerlist newline" title="Green line"><hr color="#4e9a06"></span>';

        names = names + '<div class="peerlist polydiv">';
        names = names + '<p><b>'+ translator.translate('txt_polygoncolors') + '</b></p>';
        names = names + '</div>';		
        names = names + '<span newpoly="#4e9a06" class="peerlist newpoly" title="Green polygon"><div style="background:#4e9a06">&nbsp;</div></span>';
        names = names + '<span newpoly="#cc0000" class="peerlist newpoly" title="Red polygon"><div style="background:#cc0000">&nbsp;</div></span>';
        names = names + '<span newpoly="#fce94f" class="peerlist newpoly" title="Yellow polygon"><div style="background:#fce94f">&nbsp;</div></span></p>';
        names = names + '<span newpoly="#f57900" class="peerlist newpoly" title="f57900 polygon"><div style="background:#f57900">&nbsp;</div></span></p>';
        element.html(names);
        
        $.getJSON('./mapicons/progideon_list.js', function(data) {
            var html = '';
			$.each(data.icons, function(key,val) {
				html = html+ '<span class="peerlist newpoint" newpoint="./mapicons/' + val + '"><img width=30 height=30 src="./mapicons/'+val+'"></span>';
			});
			$('#icons').html(html);
		});
			
			
		
		//$(this.options.name).change(function(){self._updateName({data:{widget: self,name: $(this).val()}})});
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_onLoaded: function(evt) {
		console.log('_onLoaded');
		var self = evt.data.widget;
	
	}
	
	});
})(jQuery);



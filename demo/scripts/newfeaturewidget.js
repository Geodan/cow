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
		core.bind("sketchcomplete", {widget: self}, self._onSketchComplete);
        
		var pointcontrol = new OpenLayers.Control.DrawFeature(core.editLayer,OpenLayers.Handler.Point);
		var linecontrol = new OpenLayers.Control.DrawFeature(core.editLayer, OpenLayers.Handler.Path);
		var polycontrol = new OpenLayers.Control.DrawFeature(core.editLayer, OpenLayers.Handler.Polygon);
		core.map.addControl(pointcontrol);
		core.map.addControl(linecontrol);
		core.map.addControl(polycontrol);
		
		element.delegate('.newpoint','click', function(){
			linecontrol.deactivate();
			polycontrol.deactivate();
			pointcontrol.activate();
			var layer = self.core.editLayer;
        	var key = $(this).attr('newpoint');
        	core.current_icon = key;
		});
		
		element.delegate('.newline','click', function(){
			pointcontrol.deactivate();
			polycontrol.deactivate();
			linecontrol.activate();
			var layer = self.core.editLayer;
        	var key = $(this).attr('newline');
        	core.current_linecolor = key;
		});
		
		element.delegate('.newpoly','click', function(){
			linecontrol.deactivate();
			pointcontrol.deactivate();
			polycontrol.activate();
			var layer = self.core.editLayer;
        	var key = $(this).attr('newpoly');
        	core.current_linecolor = key;
        	core.current_polycolor = key;
		});
		
        var names = 'Select an icon or a color and start drawing on the map';
		names = names+ '<p><b>Marker icons</b><br/>';
        names = names+ '<span newpoint="./mapicons/accesdenied.png" class="peerlist newpoint" title="No access"><img src="./mapicons/accesdenied.png"></span>';
        names = names+ '<span newpoint="./mapicons/caution.png" class="peerlist newpoint" title="Caution"><img src="./mapicons/caution.png"></span>';
        names = names+ '<span newpoint="./mapicons/blast.png" class="peerlist newpoint" title="Incident"><img src="./mapicons/blast.png"></span>';
        names = names+ '<span newpoint="./mapicons/caraccident.png" class="peerlist newpoint" title="Accident"><img src="./mapicons/caraccident.png"></span>';
		names = names+ '<span newpoint="./mapicons/treedown.png" class="peerlist newpoint" title="Tree"><img src="./mapicons/treedown.png"></span>';
		names = names+ '<span newpoint="./mapicons/radiation.png" class="peerlist newpoint" title="Radiation"><img src="./mapicons/radiation.png"></span>';
		names = names+ '<span newpoint="./mapicons/cctv.png" class="peerlist newpoint" title="Camera"><img src="./mapicons/cctv.png"></span>';
		names = names+ '<span newpoint="./mapicons/notvisited.png" class="peerlist newpoint" title="No info"><img src="./mapicons/notvisited.png"></span></p>';
		names = names + '<div class="peerlist linediv">';
		names = names + '<b>Line colors </b><br/>';
		names = names + '</div>';
		names = names + '<span newline="black" class="peerlist newline" title="Black line"><hr color="black"></span>';
		names = names + '<span newline="#204a87" class="peerlist newline" title="Blue line"><hr color="#204a87"></span>';
		names = names + '<span newline="#f57900" class="peerlist newline" title="Orange line"><hr color="#f57900"></span>';
		names = names + '<span newline="#cc0000" class="peerlist newline" title="Red line"><hr color="#cc0000"></span>';
		names = names + '<span newline="#5c3566" class="peerlist newline" title="Purple line"><hr color="#5c3566"></span>';	
		names = names + '<span newline="#4e9a06" class="peerlist newline" title="Green line"><hr color="#4e9a06"></span>';
		
		

		names = names + '<div class="peerlist polydiv">';
		names = names + '<p><b>Polygon colors</b></p>';
		names = names + '</div>';		
		names = names + '<span newpoly="#4e9a06" class="peerlist newpoly" title="Green polygon"><div style="background:#4e9a06">&nbsp;</div></span>';
		names = names + '<span newpoly="#cc0000" class="peerlist newpoly" title="Red polygon"><div style="background:#cc0000">&nbsp;</div></span>';
		names = names + '<span newpoly="#fce94f" class="peerlist newpoly" title="Yellow polygon"><div style="background:#fce94f">&nbsp;</div></span></p>';
		names = names + '<span newpoly="#f57900" class="peerlist newpoly" title="f57900 polygon"><div style="background:#f57900">&nbsp;</div></span></p>';
		
		
		element.html(
			names
		);
        
			
		
		//controls.select.activate();
		//TODO TT: auw, we moeten een fid proberen toe te kennen
		//var feature = core.editLayer.getFeaturesByAttribute(key)[0];
		//controls.select.select(feature);
		
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
	
	},
	_onSketchComplete: function(evt, feature){
		var core = evt.data.widget.core;
		//Disable the draw control(s) after drawing a feature
		var controls = map.getControlsByClass('OpenLayers.Control.DrawFeature');
		$.each(controls,function(id,control){
				control.deactivate();
		});
	}
	});
})(jQuery);



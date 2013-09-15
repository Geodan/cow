//Game widget is an extent on OlMapWidget

$.widget("cow.OlGameWidget", $.cow.OlMapWidget, {
    _create: function() {
        this._super( "_create" );
        var self = this;
        this.intervals = [];
        this.mypoints = 10;
        $('#mypoints').html(this.mypoints);
        this.core.bind("myPositionChanged",{widget: self},self._onMyPositionChanged);
    },
    _myPoints: function(p){
        var returnval;
        if (p) {
            this.mypoints = this.mypoints + p;
            returnval = this.mypoints;
        }
        else{
            returnval = this.mypoints;
            this.mypoints = 0;
        }
        $('#mypoints').html(this.mypoints);
        return returnval; 
    },
    _createLayers: function(){
        this._super("_createLayers");
        var self = this;
        /* Testje met geojson data */
		var ollayer  = new OpenLayers.Layer.Vector('zones');
		ollayer.afterAdd = function () {
			var divid = ollayer.div.id;
			var zonelayer = new d3layer("zones",{
				maptype: "OpenLayers",
				divid:divid,
				map: self.map,
				type: "path",
				labels: true,
				labelconfig: {
					field: "name",
					style: {
					    stroke: "steelBlue"
					}
				},
				style: {
					fill: "none",
					stroke: "steelBlue",
					'stroke-width': 2,
					textlocation: "ul"
				}
			});
			self.d3Layers(zonelayer);
			
			d3.json("/main/cow/demo/scripts/zones.json", function(error, data) {
			//d3.json("/main/d3test/uk.json", function(error, roads) {
			    //self.features = data.features;
			    console.log(error);
			    self.getD3LayerByName('zones').data(data);
			});
			
			
		};
		this.map.addLayer(ollayer);
		/* */
	},
	updatePoints: function(feature,obj){
	    var myteam = $('#myTeam').val();
	    
	    if (obj.TEAM == myteam){
	        this._myPoints(1);
	        obj.PUNTEN = parseInt(obj.PUNTEN) + 1;
	    }
	    else {
	        obj.PUNTEN = parseInt(obj.PUNTEN) - this._myPoints(); //At once my own points
	        obj.PUNTEN = parseInt(obj.PUNTEN) - 1; //plus one point per x seconds
	        if (obj.PUNTEN <= 0){
	            obj.TEAM = myteam;
	            obj.PUNTEN + 1;
	            this._myPoints(1);
	        }
	    }
	    
	    var desc = "TYPE:" + obj.TYPE + ";TEAM:" + obj.TEAM + ";PUNTEN:" + obj.PUNTEN + ";";
        feature.attributes.name = 'Team: ' + obj.TEAM + " | " + obj.PUNTEN;
        feature.attributes.desc = desc;
        feature.attributes.owner = self.core.username();
        
        var jsonfeature = JSON.parse(geojson_format.write(feature));//TODO is this needed?
        if (core.activeherd() == feature.properties.store){
            //core.featurestore().updateLocalFeat(jsonfeature);
            var item = core.featurestore().getFeatureItemById(feature.properties.key);
            var d = new Date();
            var timestamp = d.getTime();
            item.feature = jsonfeature;
            item.updated = timestamp;
            core.featurestore().featureItems({data:item, source: 'user'});
        }
	},
	_onMyPositionChanged: function(evt){
	    var self = evt.data.widget;
	    console.log('positionchanged');
	    //var features = self.getD3LayerByName('zones').data().features;
	    var features = self.editLayer.features;
	    if (features){
	        var html = '';
	        var objarr = [];
            features.forEach(function(f){
                var desc = f.properties.desc || ''; 
                var arr = desc.split(";");
                var obj = {};
                arr.forEach(function(str){
                    var keyval = str.split(":");
                    if (keyval[1]){ // see if value exists
                        obj[keyval[0].trim()] = keyval[1].trim();
                    }
                });
                if ((obj.TYPE == 'VAK') || (obj.TYPE == 'PUNT')){ 
                //var feat =  geojson_format.read(f)[0];
                    var feat =  f;
                    var myloc = geojson_format.read(core.me().position().feature)[0];
                    var distance = myloc.geometry.distanceTo(feat.geometry);
                    html = html + 'Distance to ' +  feat.properties.name + ': <br>' + distance + ' m.<hr>';
                    if (distance < 5 && !(self.intervals[feat.data.key])){
                        self.intervals[feat.data.key] = window.setInterval(function(){
                            self.updatePoints(f, obj);
                        },5000); //elke 5 seconden
                    }
                    else if (distance >= 5) {
                        window.clearInterval(self.intervals[feat.data.key]);
                    }
                    
               }
            });
            $('#distTo').html(html);
	    }
	}
});


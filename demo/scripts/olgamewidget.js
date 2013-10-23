//Game widget is an extent on OlMapWidget

$.widget("cow.OlGameWidget", $.cow.LeaflMapWidget, {
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
            this.mypoints = p;
            returnval = this.mypoints;
        }
        else{
            returnval = this.mypoints;
        }
        $('#mypoints').html(this.mypoints);
        return returnval; 
    },
    _createLayers: function(){
        var self = this;
        
        var lyr = new d3layer("waterlyr",{
			maptype: "Leaflet",
			map: self,
			type: "path",
			classfield: "typewater" 
		});
        this.d3Layers(lyr);
        var lyr = new d3layer("terreinlyr",{
			maptype: "Leaflet",
			map: self,
			type: "path",
			style: {
			    fill: 'none',
			    'stroke-width': '1',
			    stroke: 'steelBlue'
			}
			//classfield: "typelandgebruik" 
		});
        this.d3Layers(lyr);
        var lyr = new d3layer("relieflyr",{
			maptype: "Leaflet",
			map: self,
			type: "path",
			style: {
			    fill: "none",
			    "stroke-width": "0.5px",
			    stroke: "orange"
			}
		});
        this.d3Layers(lyr);
        var lyr = new d3layer("weglyr",{
			maptype: "Leaflet",
			map: self,
			type: "path",
			style: {
			    fill: "grey",
			    "stroke-width": "1px",
			    stroke: "grey"
			}
		});
        this.d3Layers(lyr);
        
        this._super("_createLayers");

	},
	updatePoints: function(feature,obj){
	    var myteam = $('#myTeam').val();
	    
	    if (obj.TEAM == myteam){
	        this._myPoints(this._myPoints()++);
	        obj.PUNTEN = parseInt(obj.PUNTEN) + 1; //plus one point per x seconds
	    }
	    else {
	        var objPunten = obj.PUNTEN;
	        obj.PUNTEN = parseInt(obj.PUNTEN) - this._myPoints(); //At once my own points
	        obj.PUNTEN = parseInt(obj.PUNTEN) - 1; //minus one point per x seconds
	        if (obj.PUNTEN <= 0){ //Capture object, 
	            obj.TEAM = myteam;
	            obj.PUNTEN = 1;
	            var pointsleft = this._myPoints() - objPunten;
	            this._myPoints(_this.myPoints() - objPunten); //adding what's left of my points
	        }
	    }
	    
	    var desc = "TYPE:" + obj.TYPE + ";TEAM:" + obj.TEAM + ";PUNTEN:" + obj.PUNTEN + ";";
        feature.attributes.name = 'Team: ' + obj.TEAM + " | " + obj.PUNTEN;
        feature.attributes.desc = desc;
        feature.attributes.owner = self.core.username();
        
        var jsonfeature = JSON.parse(geojson_format.write(feature));//TODO is this needed?
        if (core.activeproject() == feature.properties.store){
            //core.featurestore().updateLocalFeat(jsonfeature);
            var item = core.featurestore().getFeatureItemById(feature.properties.key);
            var d = new Date();
            var timestamp = d.getTime();
            item.feature = jsonfeature;
            item.updated = timestamp;
            core.featurestore().featureItems({data:item, source: 'user'});
        }
	},
	_updateLayer: function(coords){
	    var self = this;
	    var mylat = coords.latitude;
	    var mylon = coords.longitude;
	    var range = 0.001;
        var bbox = [mylon - range, mylat - range, mylon + range, mylat + range];
        /*
        var datasource = "/osgis/geoserver/top10nl/ows?"
            + "service=WFS&"
            + "version=1.0.0&"
            + "request=GetFeature&"
            + "typeName=top10nl:terrein&"
            + "maxFeatures=1000000&"
            + "outputFormat=json&"
            + "srsName=EPSG:4326&"
            + "bbox=" + bbox.join(",") + ",EPSG:4326";
        d3.json(datasource,
            function (json) {
                if (self.getD3LayerByName('terreinlyr')){
                    self.getD3LayerByName('terreinlyr').data(json);
                }
		});
		*/
		var datasource = "/osgis/geoserver/top10nl/ows?"
            + "service=WFS&"
            + "version=1.0.0&"
            + "request=GetFeature&"
            + "typeName=top10nl:waterdeel_vlak&"
            + "maxFeatures=1000000&"
            + "outputFormat=json&"
            + "srsName=EPSG:4326&"
            + "bbox=" + bbox.join(",") + ",EPSG:4326";
        d3.json(datasource,
            function (json) {
                if (self.getD3LayerByName('waterlyr')){
                    self.getD3LayerByName('waterlyr').data(json);
                }
		});
		var datasource = "/osgis/geoserver/top10nl/ows?"
            + "service=WFS&"
            + "version=1.0.0&"
            + "request=GetFeature&"
            + "typeName=top10nl:wegdeel_vlak_auto&"
            + "maxFeatures=1000000&"
            + "outputFormat=json&"
            + "srsName=EPSG:4326&"
            + "bbox=" + bbox.join(",") + ",EPSG:4326";
        d3.json(datasource,
            function (json) {
                if (self.getD3LayerByName('weglyr')){
                    self.getD3LayerByName('weglyr').data(json);
                }
		});
    },
	
	_onMyPositionChanged: function(evt){
	    var self = evt.data.widget;
	    console.log('positionchanged');
	    //var features = self.getD3LayerByName('zones').data().features;
	    var coords = self.core.me().position().point.coords;
	    self._updateLayer(coords);
	    //if (!self._viewIsset){
            var mylat = coords.latitude;
            var mylon = coords.longitude;
            var range = 0.001;
            var bounds = [[mylat - range, mylon - range], [mylat + range, mylon + range]];
            self.map.setMaxBounds(bounds);
            self.map.setView([coords.latitude, coords.longitude],20);
	        self._viewIsset = true;
	    //}
	    tmp = self.editLayer;
        var features = [];
        self.editLayer.eachLayer(function(d){features.push(d.feature)});
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
                    var point = core.me().position().point.coords;
                    var myloc = new L.LatLng(point.latitude,point.longitude);
                    var featloc = feat.geometry.coordinates[0]; //TODO!!!!!
                    var distance = myloc.distanceTo();
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


/** TODO: complete rewrite **/

/**Thanks to jquery-indexeddb.js:
https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md
**/


//var localdbase = {
$.Cow.LocalDbase.prototype = {
    /**
        New functions, not yet implemented
    */

    _init: function(){
        //Init herds db
        var storeOptions = {
            "autoIncrement" : false,
            "keyPath": "uid"
		};
		$.indexedDB(this.options.dbname)
		    .objectStore("herds",storeOptions);
		//Init features db
		var tablename = core.activeherd();
		$.indexedDB(this.options.dbname)
		    .objectStore("herds",storeOptions);
    },
    herdsdb: function(options) {
        var self = this;
		switch(arguments.length) {
        case 0:
            return this._getHerds();
        case 1:
            if (!$.isArray(options)) {
                return this._addHerd(options);
            }
        }
    },
    _addHerd: function(herd){
        var record = {};
        record.uid = herd.options.uid;
        record.name = herd.options.name;
        record.active = herd.options.active;
        var request = $.indexedDB(this.options.dbname)
		    .objectStore("herds",false)
		    .put(record);
		 request.onerror = function(e){
            console.warn('Error adding: '+e);
         };
         return herd;
    },
    _getHerds: function() {
        var storeOptions = {
            "autoIncrement" : false,
            "keyPath": "uid"
		};
		var herdList = [];
        var promise = $.indexedDB(this.options.dbname)
		    .objectStore("herds",storeOptions)
		    .each(function(elem){
		        var options = {};
		        options.uid = elem.value.uid;
		        options.name = elem.value.name;
		        options.active = elem.value.active;
		        self.core.herds(options);
	        });
	    return promise;
    },
    removeherd: function(uid){
        //This will never happen....
        $.indexedDB(this.options.dbname)
		    .objectStore("herds",false)["delete"](uid);
    },
    
    featuresdb: function(options) {
        var self = this;
		switch(arguments.length) {
        case 0:
            return this._getFeatures();
        case 1:
            if (!$.isArray(options)) {
                return this._addFeature(options);
            }
        }
    },
    
    _getFeatures: function(){
        var core = this.core;
		this.storeOptions = {
            "autoIncrement" : false,
            "keyPath": "key"
		};
		var tablename = core.activeherd();
		var dbname = this.options.dbname;
		var myFeatureList = [];
		var fids = [];
		var iteration = $.indexedDB(dbname)
		    .objectStore(tablename,this.storeOptions)
		    .each(function(elem){
                //array for use in map
                var item = new Object();
                item.key 	= elem.value.key 	
                item.uid 	= elem.value.uid 	
                item.created = elem.value.created 
                item.updated = elem.value.updated
                item.status = elem.value.status 
                item.feature	= elem.value.feature
                
                if (item.feature.properties && item.feature.properties.key){
                    core.featurestore().featureItems({data: item, source: 'db'});
                    var iditem = {};
                    iditem.key = item.key;
                    iditem.updated = item.updated;
                    iditem.status = item.status;
                    fids.push(iditem);
                    //myFeatureList.push(item);
                }
            });    
		iteration.done(function(){
		    //Callback that will fill featurestore
		    //core.featurestore().fill(myFeatureList);
		    self.core.trigger('storeChanged');
		    var message = {};
            message.fids = fids;
            message.storename = self.core.activeherd();
		    self.core.websocket().sendData(message, "newPeerFidList");
		});
		iteration.fail(function(e){
		    throw "Problem loading local indexeddb";        
		});
		return iteration;
    },
    
    _addFeature: function(item){
        var core = this.core;
		var newRecord = {};
		newRecord.key = item.key;
		newRecord.uid = item.uid;
		newRecord.created = item.created;
		newRecord.updated = item.updated;
		newRecord.status = item.status;
		newRecord.feature = item.feature;
		$.indexedDB(this.options.dbname)
		    .objectStore(core.activeherd(),false)
		    .put(newRecord)//Advantage of putting is that we overwrite old features with same key
		    .fail(function(error){
		            console.warn('Fail! ' + error);
		    });
    },
    
    removefeature: function(fid) {
        //This will never happen...
    },
}


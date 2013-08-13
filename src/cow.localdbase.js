/** TODO: complete rewrite **/

/**Thanks to jquery-indexeddb.js:
https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md
**/


//var localdbase = {
$.Cow.LocalDbase.prototype = {
    initHerds: function(){
        var self = this;
        var storeOptions = {
            "autoIncrement" : false,
            "keyPath": "uid"
		};
        
        $.indexedDB(this.options.dbname)
		    .objectStore("herds",storeOptions)
		    .each(function(elem){
		        var options = {};
		        options.uid = elem.value.uid;
		        options.name = elem.value.name;
		        options.active = elem.value.active;
	            self.core.herds(options);
	        });
    },
    putHerd: function(herd){
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
         
    },
    deleteHerd: function(uid){
        $.indexedDB(this.options.dbname)
		    .objectStore("herds",false)["delete"](uid);
    },
    
	// Transfers features from database to arrays
	loadFromDB: function(){
		var core = this.core;
		this.storeOptions = {
            "autoIncrement" : false,
            "keyPath": "key"
		};
		var tablename = core.activeHerd;
		var dbname = this.options.dbname;
		var myFeatureList = [];
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
                    
                    if (item.feature.properties && item.feature.properties.key)
                        myFeatureList.push(item);
                });    
		iteration.done(function(){
			//TODO TT: rewrite to trigger
			core.featurestore().fill(myFeatureList);
		});
		iteration.fail(function(e){
		    console.warn("Problem loading local indexeddb");        
		});
		return iteration;
	},
	deleteDB: function(){
	// Delete the database 
		$.indexedDB(this.options.dbname)
		    .deleteDatabase();
	},
	emptyDB: function(storename){
		$.indexedDB(this.options.dbname)
		    .objectStore(storename,this.storeOptions)
		    .clear();
	},
	addFeat: function(evt){
	    var core = this.core;
		var newRecord = {};
		newRecord.key = evt.key;
		newRecord.uid = evt.uid;
		newRecord.created = evt.created;
		newRecord.updated = evt.updated;
		newRecord.status = evt.status;
		newRecord.feature = evt.feature;
		$.indexedDB(this.options.dbname)
		    .objectStore(core.activeHerd,false)
		    .put(newRecord)//Advantage of putting is that we overwrite old features with same key
		    .fail(function(error){
		            console.warn('Fail! ' + error);
		    });
	},
	// Delete an item from featurestore
	deleteFeat: function(itemId){
	    var core = this.core;
		$.indexedDB(this.options.dbname)
		    .objectStore(core.activeHerd)["delete"](itemId)
		    .done(function(){
				core.localdbase().loadFromDB();
		});
	},
	update: function(item){
	    var core = this.core;
		$.indexedDB(this.options.dbname)
		    .objectStore(core.options.storename,false)
		    .each(function(elem) {
                if (elem.key == item.key) {
                    elem.update(item);
                }
            });
	}
}


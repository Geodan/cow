/** TODO: complete rewrite **/

/**Thanks to jquery-indexeddb.js:
https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md
**/


//var localdbase = {
$.Cow.LocalDbase.prototype = {
    
	init_db: function(dbname, tablename){
	    this.options.tablename = tablename;
        this.options.dbname = dbname;    
	    var dbOpenPromise = $.indexedDB(dbname).objectStore(tablename, true);
		// Simply open the database once so that it is created with the required tables
		//var dbOpenPromise = $.indexedDB(dbname, {
		//	"schema": {
		//		"1": function(versionTransaction){
		//			var catalog = versionTransaction.createObjectStore(tablename,{
		//					"autoIncrement" : false,
		//					"keyPath": "key"
		//			});
		//			versionTransaction.fail(function(err){console.log(err)});
		//			tmp = versionTransaction;
		//			catalog.createIndex("key");
		//		}
		//	}
		//});
		return dbOpenPromise;
	},	
	// Transfers features from database to arrays
	loadFromDB: function(){
		var core = this.core;
		var tablename = this.options.tablename;
		var dbname = this.options.dbname;
		var store = $.indexedDB(dbname).objectStore(tablename,true); 
		var myFeatureList = [];
		var iteration = store.each(function(elem){
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
			//TODO TT: rewrite to trigger and remove storename
			core.getFeaturestoreByName(tablename).fill(myFeatureList);
		});
		return iteration;
	},
	deleteDB: function(){
	// Delete the database 
		$.indexedDB(this.options.dbname)
		    .deleteDatabase();
	},
	emptyDB: function(table){
		$.indexedDB(this.options.dbname)
		    .objectStore(this.options.tablename)
		    .clear();
	},
	addFeat: function(evt){
		var newRecord = {};
		newRecord.key = evt.key;
		newRecord.uid = evt.uid;
		newRecord.created = evt.created;
		newRecord.updated = evt.updated;
		newRecord.status = evt.status;
		newRecord.feature = evt.feature;
		$.indexedDB(this.options.dbname)
		    .objectStore(this.options.tablename,true)
		    .put(newRecord)//Advantage of putting is that we overwrite old features with same key
		    .fail(function(error){
		            console.warn('Fail! ' + error);
		    });
		
		
	},
	// Delete an item from featurestore
	deleteFeat: function(itemId){
		$.indexedDB(this.options.dbname)
		    .objectStore(this.options.tablename)["delete"](itemId)
		    .done(function(){
				core.localdbase().loadFromDB();
		});
	},
	update: function(item){
		$.indexedDB(this.options.dbname)
		    .objectStore(this.options.tablename)
		    .each(function(elem) {
                if (elem.key == item.key) {
                    elem.update(item);
                }
            });
	}
}





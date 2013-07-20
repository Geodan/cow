/** TODO: complete rewrite **/

/**Thanks to jquery-indexeddb.js:
https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md
**/


//var localdbase = {
$.Cow.LocalDbase.prototype = {
	init_db: function(dbname, tablename){
		// Simply open the database once so that it is created with the required tables
		var dbOpenPromise = $.indexedDB(dbname, {
			//"version": 1,
			"upgrade": function(transaction){
			},
			"schema": {
				"1": function(versionTransaction){
					var catalog = versionTransaction.createObjectStore(tablename,{
							"autoIncrement" : false,
							"keyPath": "key"
					});
					catalog.createIndex("key");
				}
			}
		});
		return dbOpenPromise;
	},	
	// Transfers features from database to arrays
	loadFromDB: function(){
		var core = this.core;
		var tablename = this.options.tablename;
		var dbname = this.options.dbname;
		var store = $.indexedDB(dbname).objectStore(tablename); 
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
		$.indexedDB(this.options.dbname).deleteDatabase();
	},
	emptyDB: function(table){
		$.indexedDB(this.options.dbname).objectStore(this.options.tablename).clear();
	},
	addFeat: function(evt){
		var newRecord = {};
		newRecord.key = evt.key;
		newRecord.uid = evt.uid;
		newRecord.created = evt.created;
		newRecord.updated = evt.updated;
		newRecord.status = evt.status;
		newRecord.feature = evt.feature;
		var db = $.indexedDB(this.options.dbname);
		var store = db.objectStore(this.options.tablename);
		//Advantage of putting is that we overwrite old features with same key
		trans = store.put(newRecord);
		trans.done(function(){
		});
		trans.fail(function(error, event){
				alert('Fail! ' + event.message);
		});
	},
	// Delete an item from featurestore
	deleteFeat: function(itemId){
		$.indexedDB(this.options.dbname).objectStore(this.options.tablename)["delete"](itemId).done(function(){
				core.localdbase().loadFromDB();
		});
	},
	update: function(item){
		var store = $.indexedDB(this.options.dbname).objectStore(this.options.tablename);
		store.each(function(elem) {
			if (elem.key == item.key) {
				elem.update(item);
			}
		});
	}
}





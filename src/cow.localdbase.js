/** TODO: complete rewrite **/

//var localdbase = {
$.Cow.LocalDbase.prototype = {
	init_db: function(){
		// Simply open the database once so that it is created with the required tables
		var dbOpenPromise = $.indexedDB("sharedMap3", {
			"version": 1,
			"upgrade": function(transaction){
			},
			"schema": {
				"1": function(versionTransaction){
					var catalog = versionTransaction.createObjectStore("featureStore1",{
							"autoIncrement" : false,
							"keyPath": "key"
					});
					catalog.createIndex("key");
				}
			}
		});
		dbOpenPromise.fail(function(error, event){
			alert('error: ' + event);
		});
		return dbOpenPromise;
	},	
	// Transfers features from database to arrays
	loadFromDB: function(){
		var core = this.core;
		var store = $.indexedDB("sharedMap3").objectStore("featureStore1"); 
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
			//TODO TT: rewrite to trigger
			core.getFeaturestoreByName("store1").fill(myFeatureList);
		});
		return iteration;
	},
	deleteDB: function(){
	// Delete the database 
		$.indexedDB("sharedMap3").deleteDatabase();
	},
	emptyDB: function(table){
		$.indexedDB("sharedMap3").objectStore("featureStore1").clear();
	},
	addFeat: function(evt){
		var newRecord = {};
		newRecord.key = evt.key;
		newRecord.uid = evt.uid;
		newRecord.created = evt.created;
		newRecord.updated = evt.updated;
		newRecord.status = evt.status;
		newRecord.feature = evt.feature;
		var store = $.indexedDB("sharedMap3").objectStore("featureStore1");
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
		$.indexedDB("sharedMap3").objectStore("featureStore1")["delete"](itemId).done(function(){
				core.localdbase().loadFromDB();
		});
	},
	update: function(item){
		var store = $.indexedDB("sharedMap3").objectStore("featureStore1");
		store.each(function(elem) {
			if (elem.key == item.key) {
				elem.update(item);
			}
		});
	}
}





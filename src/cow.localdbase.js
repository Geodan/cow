/**Thanks to jquery-indexeddb.js:
https://github.com/axemclion/jquery-indexeddb/blob/gh-pages/docs/README.md
**/


//var localdbase = {
$.Cow.LocalDbase.prototype = {
   _init: function(){
        //Init herds db
        var storeOptions = {
            "autoIncrement" : false,
            "keyPath": "uid"
		};
		$.indexedDB(this.options.dbname)
		    .objectStore("herds",storeOptions);
		//Init items db
		var tablename = core.activeherd();
		$.indexedDB(this.options.dbname)
		    .objectStore("herds",storeOptions);
    },
    //HERDS
    herdsdb: function(options) {
        
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
        var self = this;
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
    
    //ITEMS
    itemsdb: function(options) {
        var self = this;
		switch(arguments.length) {
        case 0:
            return this._getItems();
        case 1:
            if (!$.isArray(options)) {
                return this._addItem(options);
            }
        }
    },
    
    _getItems: function(){
        var core = this.core;
        var self = this;
		this.storeOptions = {
            "autoIncrement" : false,
            "keyPath": "key"
		};
		var tablename = core.activeherd();
		var dbname = this.options.dbname;
		var expirytime = this.options.expirytime;
		var myItemList = [];
		var fids = [];
		var iteration = $.indexedDB(dbname)
		    .objectStore(tablename,this.storeOptions)
		    .each(function(elem){
                //array for use in map
                //SMO: replace this with an $.Cow.Item
                var item = new Object();
                item.key 	 = elem.value.key; 	
                item.uid 	 = elem.value.uid; 	
                item.created = elem.value.created; 
                item.updated = elem.value.updated;
                item.status  = elem.value.status; 
                item.data = elem.value.data;
                var d_creation = new Date(item.updated)
                var d_now = new Date();
                var d_diff = (d_now - d_creation)/1000; //(age in seconds)
                
                if (item.data && item.data.properties && item.data.properties.key
                    && !(tablename == 666 && d_diff > expirytime)){
                    core.itemstore().items({data: item, source: 'db'});
                    var iditem = {};
                    iditem.key = item.key;
                    iditem.updated = item.updated;
                    iditem.status = item.status;
                    fids.push(iditem);
                    //myFeatureList.push(item);
                }
                else { //We can safely remove items that are over their expiry date
                    self.removeItem(item.key);
                }
                //SMO: TODO till here
            });    
		iteration.done(function(){
		    //Callback that will fill itemstore
		    //core.itemstore().fill(myitemList);
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
    
    _addItem: function(item){
        var core = this.core;
        var tablename = core.activeherd();
		var newRecord = {};
		newRecord.key = item.key;
		newRecord.uid = item.uid;
		newRecord.created = item.created;
		newRecord.updated = item.updated;
		newRecord.status = item.status;
		newRecord.data = item.data;
		var d_creation = new Date(item.updated);
        var d_now = new Date();
        var d_diff = (d_now - d_creation)/1000; //(age in seconds)
        if (!(tablename == 666 && d_diff > this.options.expirytime)){
            $.indexedDB(this.options.dbname)
                .objectStore(core.activeherd(),false)
                .put(newRecord)//Advantage of putting is that we overwrite old items with same key
                .then(function(){
                    //console.log("Data added");
                }, function(e){
                    console.log("Error adding data " + e);
                });
        }
        
    },
    
    removeItem: function(fid) {
        $.indexedDB(this.options.dbname)
		    .objectStore(core.activeherd(),false)["delete"](fid);
    },
}


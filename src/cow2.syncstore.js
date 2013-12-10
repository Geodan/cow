window.Cow = window.Cow || {};
//Synstore keeps track of records
Cow.syncstore =  function(config){
    this._dbname = config.dbname;
    this._core = config.core;
    if (!config.noIDB){
        this._db = new Pouch(config.dbname);
        this.initpromise = this._initRecords();
    }
}; 

Cow.syncstore.prototype =  
{ //pouchdb object
    //All these calls will be asynchronous and thus returning a promise instead of data
    _db_addRecord: function(config){
        var data = config.data;
        var source = config.source;
        data._id = data._id.toString();
        var deferred = new jQuery.Deferred(); //TODO, remove jquery dependency
        switch (source){
            case 'UI': //New for sure, so we can use put
                this._db.put(data, function(err, out){
                    if (err){
                        deferred.reject(err);
                    }
                    else{
                        deferred.resolve(out);
                    }
                });
                break;
            case 'WS': //Unsure wether new, so we use post
                //TODO: include the _rev here
                this._db.post(data,function(err, out){
                    if (err){
                        deferred.reject(err);
                    }
                    else{
                        deferred.resolve(out);
                    }
                });
                break;
        }
        return deferred.promise();
    }, 
    _db_updateRecord: function(config){
        var data = config.data;
        var self = this;
        if (!data._id){
            console.warn('No _id given. Old version client connected?');
            return(null);
        }
        var source = config.source;
        data._id = data._id.toString();
        var deferred = new jQuery.Deferred(); //TODO, remove jquery dependency
        var promise;
        //TODO: the way I try to get a promise is not right here....
        //as a result I'm not getting a promise from _updateRecord or at least not in time
        switch (source){
            case 'UI': 
                this._db.get(data._id, function(err,doc){
                    if (err) {
                        if (err.reason == 'missing'){ //not really an error, just a notice that the record would be new
                            return self._db_addRecord({source: source, data: data});
                        }
                        else{
                            //console.warn('Dbase error: ' , err);
                            deferred.reject(err);
                            return deferred.promise();
                        }
                    }
                    else { //overwrite existing
                        data._rev = doc._rev;
                        return self._db_addRecord({source: source, data: data});
                    }
                });
                break;
            case 'WS':
                this._db.put(data,function(err, out){
                    if (err) {
                        //console.warn('Dbase error: ' , err);
                        deferred.reject(err);
                    }
                    else {
                        deferred.resolve(out);
                    }
                    return deferred.promise();
                });
                break;
            default:
                console.warn('Wrong source type: ',source);
                return null;
        }
        
    
    },
    _db_getRecords: function(){
        var deferred = new jQuery.Deferred();
        this._db.allDocs({include_docs:true,descending: true}, function(err,doc){
            if (err) {
                //console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc);
            }
        });
        return deferred.promise();
    },  //returns promise
    _db_getRecord: function(id){
        var deferred = new jQuery.Deferred();
        this._db.get(id, function(err,doc){
            if (err) {
                //console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc);
            }
        });
        return deferred.promise();
    }, //returns promise
    _db_removeRecord: function(id){
        var deferred = new jQuery.Deferred();
        this._db.get(id, function(err,doc){
            if (err) {
                //console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                db.remove(doc, function(err, response) {
                        deferred.resolve(response);
                });
            }
        });
        return deferred.promise();
    }, //returns promise
    _initRecords: function(){ //This will start the process of getting records from pouchdb (returns promise)
        var promise = this._db_getRecords();
        var self = this;
        promise.done(function(r){
             
             r.rows.forEach(function(d){
                 //console.log(d.doc);
                 var record = self._recordproto(d.doc._id);
                 record.inflate(d.doc);
                 var existing = false; //Not likely to exist in the _records at this time but better safe then sorry..
                 for (var i=0;i<self._records.length;i++){
                    if (self._records[i]._id == record._id) {
                        existing = true; //Already in list
                        record = -1;
                    }
                 }
                 if (!existing){
                     self._records.push(record); //Adding to the list
                 }
             });
             //TODO: trigger 'storeInitialized'
        });
        return promise;
     },
    _getRecords: function(idarray){
        var returnArray = [];
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (idarray.indexOf(record._id) > -1) {
                returnArray.push(record);
            }
        }
        return returnArray;
    }, //returns all records, if ID array is filled, only return that records 
    _getRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record._id == id) {
                return record;
            }
        }
        return false;
    },
    /**
    _addRecord - creates a new record and replaces an existing one with the same _id
        when the source is 'WS' it immidiately sends to the _db, if not the record needs a manual record.sync()
    **/
    _addRecord: function(config){
        if (!config.source || !config.data){
            console.warn('Wrong input: ',config);
            return false;
        }
        var promise = null;
        var source = config.source;
        var data = config.data;
        var existing = false;
        //Create a new record and inflate with the data we got
        var record = this._recordproto(data._id);
        record.inflate(data);
        //Check to see if the record is existing or new
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == data._id) {
                if (this._db && source == 'WS'){ //update the db
                    promise = this._db_updateRecord({source:source, data: record.deflate()});
                    //TODO: get _rev id from promise and add to record
                }
                existing = true; //Already in list
                //replace the record with the newly created one
                this._records.splice(i,1,record);
            }
        }
        if (!existing){
            if (this._db && source == 'WS'){
                promise = this._db_addRecord({source:source,data:record.deflate()});
                //TODO: get _rev id from promise and add to record
            }
            this._records.push(record); //Adding to the list
        }
        return record;
    },
   /**
        Only to be used from client API
   
        records() - returns array of all records
        records(id) - returns record with id (or null)
        records({config}) - creates and returns record
    **/

    records: function(config){
        if (config && Array.isArray(config)){
            return this._getRecords(config);
        }
        else if (config && typeof(config) == 'object'){
            return this._addRecord({source: 'UI', data: config}).status('dirty');
        }
        else if (config && (typeof(config) == 'number') || typeof(config) == 'string'){
            return this._getRecord(config);
        }
        else{
            return this._records;
        }
    },
    //Removing records is only useful if no local dbase is used among peers
    _removeRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == id) {
                    this._records.splice(i,1);
                    return true;
            }
        }
        return false;
    },
    /**
        clear() - remove all records
    **/
    clear: function(){
        this._records = [];
    },
    /**
    syncRecord() - sync 1 record
    **/
    syncRecord: function(record){
        var message = {};
        message.syncType = this._type;
        record.status('clean');
        message.record = record.deflate();
        if (this._projectid){ //parent store
            message.project = this._projectid;
        }
        if (this._db){
            var promise = this._db_updateRecord({source:'UI', data: record.deflate()});
        }
        this._core.websocket().sendData(message, 'updatedRecord');
    },
    
    /**
    syncRecords() - looks for dirty records and starts syncing them
    **/
    syncRecords: function(){
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record._status == 'dirty') {
                this.syncRecord(record);
            }
        }
    },
    
    
    /**
    idList() - needed to start the syncing with other peers
                only makes sense after fully loading the indexeddb 
    **/
    idList: function(){
        var fids = [];
        for (var i=0;i<this._records.length;i++){
            var item = this._records[i];
            var iditem = {};
            iditem._id = item._id;
            iditem.timestamp = item.timestamp();
            iditem.status = item.status();
            fids.push(iditem);    
        }
        return fids;
    },
    /**
    requestItems(array) - returns the items that were requested 
    **/
    requestRecords: function(fidlist){
		var pushlist = [];
		for (i=0;i<this._records.length;i++){
		    var localrecord =  this._records[i];
		    for (j=0;j<fidlist.length;j++){
                var rem_val = fidlist[j];
                if (rem_val == localrecord._id){
                    pushlist.push(localrecord.deflate());
                }
            }
		}
		return pushlist;
	},
    /**
	compareRecords(config) - compares incoming idlist with idlist from current stack based on timestamp and status
					generates 2 lists: requestlist and pushlist
	**/
    compareRecords: function(config){
        var uid = config.uid;   //id of peer that sends syncrequest
        var fidlist = config.list;
		var returndata = {};
		var copyof_rem_list = [];
		returndata.requestlist = [];
		returndata.pushlist = [];
		var i;
		//Prepare copy of remote fids as un-ticklist, but only for non-deleted items
		if (fidlist){
			for (i=0;i<fidlist.length;i++){
				if (fidlist[i].status != 'deleted'){
					copyof_rem_list.push(fidlist[i]._id);
				}
			}
			for (i=0;i<this._records.length;i++){
					var local_item = this._records[i];
					var found = -1;
					for (var j=0;j<fidlist.length;j++){
							//in both lists
							var rem_val = fidlist[j];
							if (rem_val._id == local_item._id){
								found = 1;
								//local is newer
								if (rem_val._updated < local_item._updated){
									returndata.pushlist.push(local_item.deflate());
								}
								//remote is newer
								else if (rem_val._updated > local_item._updated){
									returndata.requestlist.push(rem_val._id);
								}
								//remove from copyremotelist
								//OBS var tmppos = $.inArray(local_item._id,copyof_rem_list);
								var tmppos = copyof_rem_list.indexOf(local_item._id);
								if (tmppos >= 0){
									copyof_rem_list.splice(tmppos,1);
								}
							}
					}
					//local but not remote and not deleted
					if (found == -1 && local_item.status() != 'deleted'){
						returndata.pushlist.push(local_item.deflate());
					}
			}
		}
		//Add remainder of copyof_rem_list to requestlist
		for (i=0;i<copyof_rem_list.length;i++){
		    var val = copyof_rem_list[i];
			returndata.requestlist.push(val);	
		}
		
  //This part is only for sending the data
  /* Obsolete by new websocket prototcol. Still interesting for partial syncing method though.
		var message = {};
        //First the requestlist
        message.requestlist = returndata.requestlist;
        message.pushlist = []; //empty
        //message.storename = payload.storename;
        message.dbname = this._dbname;
        //this._core.websocket().sendData(message,'syncPeer',uid);
        //Now the pushlist bit by bit
        message.requestlist = []; //empty
        var k = 0;
        for (j=0;j<returndata.pushlist.length;j++){
                var item = returndata.pushlist[j];
                message.pushlist.push(item);
                k++;
                if (k >= 1) { //max 1 feat every time
                    k = 0;
                    //this._core.websocket().sendData(message,'syncPeer',uid);
                    message.pushlist = []; //empty
                }
        }
        //sent the remainder of the list
        if (k > 0){
            //this._core.websocket().sendData(message,'syncPeer',uid);
        }
    */
   //end of sending data
        return returndata;
    } 
};

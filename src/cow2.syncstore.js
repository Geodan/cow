window.Cow = window.Cow || {};
//Synstore keeps track of records
Cow.syncstore =  function(config){
    var self = this;
    this._dbname = config.dbname;
    this._core = config.core;
    console.log('new store',this._dbname);
    this.loaded = new Promise(function(resolve, reject){
        console.log('reading db ',self._dbname);
        if (config.noIDB){
            resolve();
        }
        else {
            /**
                See for indexeddb wrapper:
                    https://github.com/aaronpowell/db.js
            **/
            db.open( {
                server: self._dbname,
                version: 1,
                schema: {
                    main: {                                          
                        key: { keyPath: '_id' , autoIncrement: false },
                        // Optionally add indexes
                        indexes: {
                            updated: { },
                            _id: { unique: true }
                        }
                    }
                }
            } ).done( function ( s ) {
                self._db = s;
                self._db_getRecords().then(function(rows){
                    console.log('Got records from db ',self._dbname);
                    rows.forEach(function(d){
                         //console.log(d);
                         var record = self._recordproto(d._id);
                         record.inflate(d);
                         var existing = false; 
                         //Not likely to exist in the _records at this time but better safe then sorry..
                         for (var i=0;i<self._records.length;i++){
                            if (self._records[i]._id == record._id) {
                                //existing = true; //Already in list
                                //record = -1;
                            }
                         }
                         if (!existing){
                             self._records.push(record); //Adding to the list
                         }
                     });
                     self.trigger('datachange');
                     resolve();
                }).catch(function(e){
                    console.warn(e.message);
                });
            });
        }
    });
}; 
/**
    See for use of promises: 
        1. http://www.html5rocks.com/en/tutorials/es6/promises/
        2. https://github.com/jakearchibald/ES6-Promises
**/

Cow.syncstore.prototype =  
{ //db object
    //All these calls will be asynchronous and thus returning a promise instead of data
   
    //_db_addRecord: function(config){
    _db_write: function(config){
        var data = config.data;
        var source = config.source;
        data._id = data._id.toString();
        var self = this;
        var db = this._db;
        return new Promise(function(resolve, reject){
            db.main.remove(data._id).done(function(){
                db.main.add(data).done(function(d){
                    resolve(d);
                }).fail(function(d,e){
                    console.warn(e);
                    reject(e);
                });
            }).fail(function(e){
                console.warn(e);
                reject(e);
            });
        });
    },
    _db_getRecords: function(){
        var self = this;
        return new Promise(function(resolve, reject){
           self._db.main.query().filter().execute().done(function(doc){
                resolve(doc);
           }).fail(function(e){
                reject(e);
           });
        });
    },  //returns promise
    _db_getRecord: function(id){
        var self = this;
        return new Promise(function(resolve, reject){
            self._db.main.query().filter('_id',id).execute().done(function(doc){
                resolve(doc);
            }).fail(function(doc){
                reject(doc);
            });
        });
    }, //returns promise
    _db_removeRecord: function(id){
        var self = this;
        return new Promise(function(resolve, reject){
             db.main.remove(data._id).done(function(){
                 resolve();
             }).fail(function(){
                 reject();
             });
        });
      }, //returns promise
    _initRecords: function(){ //This will start the process of getting records from db (returns promise)
        var promise = this._db_getRecords();
        var self = this;
        promise.then(function(r){
             
             r.forEach(function(d){
                 //console.log(d.doc);
                 var record = self._recordproto(d._id);
                 record.inflate(d);
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
             self.trigger('datachange');
        });
        return promise;
     },
    //_getRecords([<string>]) - return all records, if ID array is filled, only return that records
    _getRecords: function(idarray){
        var returnArray = [];
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (idarray.indexOf(record._id) > -1) {
                returnArray.push(record);
            }
        }
        return returnArray;
    },
    //_getRecord(<string>) - return record or create new one based on id
    _getRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record._id == id) {
                return record;
            }
        }
        //var config = {_id: id};
        //return this._addRecord({source: 'UI', data: config}).status('dirty');
        //TODO: rethink this strategy: should we make a new record on non-existing or just return null
        return null;
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
        var record;
        //Check to see if the record is existing or new
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == data._id) {
                existing = true; //Already in list
                record = this._records[i];
                record.inflate(data);
                if (this._db && source == 'WS'){ //update the db
                    //promise = this._db_updateRecord({source:source, data: record.deflate()});
                    this._db_write({source:source, data: record.deflate()});
                }
            }
        }
        if (!existing){
            //Create a new record and inflate with the data we got
            record = this._recordproto(data._id);
            record.inflate(data);
            if (this._db && source == 'WS'){
                promise = this._db_write({source:source,data:record.deflate()});
            }
            this._records.push(record); //Adding to the list
            //console.log(this._records.length); 
        }
        this.trigger('datachange');
        return record;
    },
    _getRecordsOn: function(timestamp){
        var returnarr = [];
        _.each(this._records, function(d){
            //If request is older than feature itself, disregard
            if (timestamp < d._created){
                //don't add
            }
            //If request is younger than last feature update, return normal data
            else if (timestamp > d._updated){
                returnarr.push(d);
            }
            else if (d.data(timestamp)){
                returnarr.push(d); //TODO: hier gebleven
            }
        });
        return returnarr;
    },
   /**
        Only to be used from client API
   
        records() - returns array of all records
        records(timestamp) - returns array of records created before timestamp
        records(id) - returns record with id (or null)
        records([id]) - returns array of records from id array
        records({config}) - creates and returns record
    **/

    records: function(config){
        if (config && Array.isArray(config)){
            return this._getRecords(config);
        }
        else if (config && typeof(config) == 'object'){
            return this._addRecord({source: 'UI', data: config}).status('dirty');
        }
        else if (config && typeof(config) == 'string'){
            return this._getRecord(config);
        }
        else if (config && typeof(config) == 'number'){
            return this._getRecordsOn(config);
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
                    this.trigger('datachange');
                    return true;
            }
        }
        return false;
    },
    /**
        clear() - remove all records, generally not useful since other peers will resent the data
    **/
    clear: function(){
        this._records = [];
    },
    /**
        deleteAll() - sets all records to deleted=true
    **/
    deleteAll: function(){
        for (var i=0;i<this._records.length;i++){
            this._records[i].deleted(true);
        }
        this.syncRecords();
        this.trigger('datachange');
        return this;
    },
    /**
    syncRecord() - sync 1 record, returns record
    **/
    syncRecord: function(record){
        
        var self = this;
        var message = {};
        message.syncType = this._type;
        record.status('clean');
        
        if (this._projectid){ //parent store
            message.project = this._projectid;
        }
        if (this._db){
            //var promise = this._db_updateRecord({source:'UI', data: record.deflate()});
            var promise = this._db_write({source:'UI', data: record.deflate()});
            promise.then(function(d){ //wait for db
                message.record = record.deflate();
                self.trigger('datachange');
                self._core.websocket().sendData(message, 'updatedRecord');
            },function(err){
                console.warn(err);
            });
        } else { //No db, proceed immediately
            message.record = record.deflate();
            self.trigger('datachange');
            self._core.websocket().sendData(message, 'updatedRecord');
        }//TODO: remove this double code, but keep promise/non-promise intact
        return record;
    },
    
    /**
    syncRecords() - looks for dirty records and returns them all at once for syncing them
    **/
    syncRecords: function(){
        var pushlist = [];
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record._status == 'dirty') {
                //this.syncRecord(record);
                record.status('clean');
                pushlist.push(record.deflate());
            }
        }
        var data =  {
            "syncType" : this._type,
            "project" : this._projectid,
            "list" : pushlist
        };
        this._core.websocket().sendData(data, 'requestedRecords');
    },
    
    /**
    deltaList() - needed to sync the delta's
    **/
    deltaList: function(){
        
    },
    
    /**
    **/
    compareDeltas: function(){
        
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
            iditem.deleted = item.deleted();
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
				if (fidlist[i].deleted != 'true'){
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
								if (rem_val.timestamp < local_item._updated){
									returndata.pushlist.push(local_item.deflate());
								}
								//remote is newer
								else if (rem_val.timestamp > local_item._updated){
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
					if (found == -1 && local_item.deleted() != 'true'){
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
//Adding some Backbone event binding functionality to the store
_.extend(Cow.syncstore.prototype, Events);

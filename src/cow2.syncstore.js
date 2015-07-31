(function(){

var root = this;
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Cow || {};
    }
    exports.Cow = Cow || {}; 
} else {
    root.Cow = Cow || {};
}

//Synstore keeps track of records
Cow.syncstore =  function(config){
    var self = this;
    this._storename = config.dbname;
    this._isloaded = false; //Used in messenger.js to check if store is loaded (workaround)
    this._core = config.core;
    this.noDeltas = config.noDeltas || false;
    this.noIDB = config.noIDB || false;
    this.maxStaleness = config.maxAge || null;
    this.syncinfo = {
        toReceive: [],
        toSent: [],
        received: 0, 
        send: 0
    };      
    if (!this.noIDB){
        this.localdb = this._core.localdb();//new Cow.localdb(config, this);
        this._commitqueue = {
            storename:this._storename,
            projectid: this._projectid,
            data: []
        };
    }
    this.loaded = new Promise(function(resolve, reject){
        if (self.localdb){
            self._core.dbopen()
              .then(function(){
                self.localdb.getRecords({
                        storename: self._storename, 
                        projectid: self._projectid
                    })
                  .then(function(rows){
                    
                    rows.forEach(function(d){
                         var record = self._recordproto(d._id);
                         record.inflate(d);
                         var lastupdate = record.updated();
                         var now = new Date().getTime();
                         var staleness = now - lastupdate;
                         var existing = false; 
                         //Not likely to exist in the _records at this time but better safe then sorry..
                         for (var i=0;i<self._records.length;i++){
                            if (self._records[i]._id == record._id) {
                                existing = true; //Already in list
                                //record = -1;
                            }
                         }//Object should be non existing yet and not older than some max setting
                         if (!existing && (staleness <= self.maxStaleness || self.maxStaleness === null)){
                             self._records.push(record); //Adding to the list
                         }
                         //If it is stale, than remove it from the database
                         if(self.maxStaleness && staleness > self.maxStaleness){
                             self.localdb.delRecord({
                                storename:self._storename,
                                projectid: self._projectid,
                                id: record._id
                             });
                         }
                     });
                    self.trigger('datachange');
                    self._isloaded = true;
                    resolve();
                },function(d){ 
                    console.warn('DB Fail');
                    reject(d);
                });
            }, function(d){
                console.warn('DB Fail');
                reject(d);
            });
        }
        else { //NO localdb, so nothing to load and we're done immediately
            self._isloaded = true;
            resolve();
        }
    });
    this.synced = new Promise(function(resolve, reject){
        self.loaded.then(function(){
            self.on('synced', function(){
                    resolve();
            });
            //self.sync(); //disabled sync here because we want to wait for all the stores to be synced
        });
        self.loaded.catch(function(e){
            console.error(e.message);
            reject();
        });
    });
}; 
/**
    See for use of promises: 
        1. http://www.html5rocks.com/en/tutorials/es6/promises/
        2. https://github.com/jakearchibald/ES6-Promises
**/

Cow.syncstore.prototype =  
{
    /** NOT USED AT THE MOMENT **/
    /*
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
    */
    /** NOT USED AT THE MOMENT **/
    /*
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
      */
      /** 
        _loadFromDb() - This will start the process of getting records from db (returns promise)
            experimental, used for nodejs client
      **/
      
    _loadFromDb: function(){ 
        var self = this;
        return new Promise(function(resolve, reject){
            self.localdb.getRecords({
                    storename: self._storename, 
                    projectid: self._projectid
                })
              .then(function(rows){
                
                rows.forEach(function(d){
                     var record = self._recordproto(d._id);
                     record.inflate(d);
                     var lastupdate = record.updated();
                     var now = new Date().getTime();
                     var staleness = now - lastupdate;
                     var existing = false; 
                     //Not likely to exist in the _records at this time but better safe then sorry..
                     for (var i=0;i<self._records.length;i++){
                         //Object exists but is newer (only happens if localdb is updated from outside
                        if (self._records[i]._id == record._id && self._records[i]._updated < record._updated) {
                            self._records.splice(i,1,record); //replace with new
                            existing = true; //Already in list
                        }
                        else if (self._records[i]._id == record._id && self._records[i]._updated >= record._updated) {
                            existing = true; //Already in list
                            //record = -1;
                        }
                     }//Object should be non existing yet and not older than some max setting
                     if (!existing && (staleness <= self.maxStaleness || self.maxStaleness === null)){
                         self._records.push(record); //Adding to the list
                     }
                     //If it is stale, than remove it from the database
                     else if(self.maxStaleness && staleness > self.maxStaleness){
                         self.localdb.delRecord({
                            storename:self._storename,
                            projectid: self._projectid,
                            id: record._id
                         });
                     }
                 });
                self.trigger('datachange');
                resolve();
            },function(d){ 
                console.warn('DB Fail');
                reject(d);
            });
        });
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
        //return this._addRecord({source: 'UI', data: config}).dirty(true);
        //TODO: rethink this strategy: should we make a new record on non-existing or just return null
        return null;
    },
    /**
    _addRecord - creates a new record or replaces an existing one with the same _id
        when the source is 'WS' it immidiately sends to the local, if not the record needs a manual record.sync()
    **/
    _addRecord: function(config){
        if (!config.source || !config.data){
            console.warn('Wrong input: ' + config);
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
                //record.deleted(false); //set undeleted //TT: disabled, since this gives a problem when a record from WS comes in as deleted
                if (this.localdb && source == 'WS'){ //update the db
                	//Disabled because new way of adding records by first adding them to a commitqueue
                    //this.localdb.write({
                    //    storename:this._storename,
                    //    projectid: this._projectid,
                    //    data:record.deflate()
                    //});
                    this._commitqueue.data.push(record.deflate());
                }
            }
        }
        if (!existing){
            //Create a new record and inflate with the data we got
            record = this._recordproto(data._id);
            record.inflate(data);
            if (this.localdb && source == 'WS'){
            	//Disabled because New way of adding records by first adding them to a commitqueue
                //this.localdb.write({
                //    storename:this._storename,
                //    projectid: this._projectid,
                //    data:record.deflate()
                //});
                this._commitqueue.data.push(record.deflate());
            }
            this._records.push(record); //Adding to the list
            //console.log(this._records.length); 
        }
        
        return record;
    },
    /**
        _commit() - sends the commitqueue to the idb
    **/
    _commit: function(){
        if (!this.noIDB && this._commitqueue.data.length > 0){
            //console.log('starting commit for ', this._commitqueue.data.length, this._storename);
            this._commitqueue.projectid = this._projectid;
            this.localdb.writeAll(this._commitqueue);
            this._commitqueue.data = [];
        }
        
    },
    
    /**
        _getRecordsOn(timestamp) - 
    **/
    _getRecordsOn: function(timestamp){
        var returnarr = [];
        this._records.forEach(function(d){
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
            return this._addRecord({source: 'UI', data: config}).dirty(true);
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
                    //this.trigger('datachange');
                    return true;
            }
        }
        return false;
    },
    /**
        clear() - remove all records, generally not useful since other peers will resent the data
    **/
    clear: function(){
        var self = this;
        return new Promise(function(resolve, reject){
            self._records = [];
            self.trigger('datachange');
            if (self.localdb){
                self.localdb.clear({
                    storename: self._storename, 
                    projectid: self._projectid
                }).then(function(){
                        resolve(); //empty dbase from items
                });
            }
            else {
                resolve();
            }
        });
    },
    /**
        deleteAll() - sets all records to deleted=true
    **/
    deleteAll: function(){
        for (var i=0;i<this._records.length;i++){
            this._records[i].deleted(true);
        }
        this.syncRecords();//FIXME: syncrecords is not perfect yet (see below)
        this.trigger('datachange');
        return this;
    },
    /**
    syncRecord() - sync 1 record, returns record
    **/
    syncRecord: function(record){
        var promise;
        var self = this;
        var message = {};
        message.syncType = this._type;
        record.dirty(false);
        
        if (this._projectid){ //parent store
            message.project = this._projectid;
        }
        if (this.localdb){
            promise = this.localdb.write({
                storename:this._storename,
                projectid: this._projectid,
                data: record.deflate()
            });
        }
        else { //Immediately resolve promise
            promise = new Promise(function(resolve, reject){resolve();});
        }
        promise.then(function(d){ //wait for db
            message.record = record.deflate();
            self.trigger('datachange');
            self._core.messenger().sendData(message, 'updatedRecord');
        },function(err){
            console.warn(err);
        });
        return record;
    },
    
    /**
    syncRecords() - looks for dirty records and returns them all at once for syncing them
    TT: this function does *not* update the localdb and does *not* trigger a datachange.
    	Therefore it is unsuited for use at the moment.
    **/
    syncRecords: function(){
    	console.warn('syncRecords is not fully functional!. Please sync record by record.');
        var pushlist = [];
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record.dirty()) {
                //this.syncRecord(record);
                record.dirty(false);
                pushlist.push(record.deflate());
            }
        }
        var data =  {
            "syncType" : this._type,
            "project" : this._projectid,
            "list" : pushlist
        };
        this._core.messenger().sendData(data, 'requestedRecords');
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
    sync() - sync the whole store, not only dirty records
    **/
    sync: function(){
        var self = this;
        self.loaded.then(function(d){
            var message = {};
            message.syncType = self._type;
            message.project = self._projectid;
            message.list = self.idList();
            self._core.messenger().sendData(message, 'newList');
            
        });
        self.loaded.catch(function(e){
                console.error(e.message);
                reject();
        });
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
            iditem.timestamp = item.updated();
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
		for (var i=0;i<this._records.length;i++){
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
	compareRecords(config) - compares incoming idlist with idlist from current stack based on timestamp and dirtystatus
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
				//if (fidlist[i].deleted != 'true'){
					copyof_rem_list.push(fidlist[i]._id);
				//}
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
}.call(this));
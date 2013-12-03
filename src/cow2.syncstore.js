window.Cow = window.Cow || {};
//Synstore keeps track of records
Cow.syncstore =  function(config){
    this._dbname = config.dbname;
    if (!config.noIDB){
        this._db = new PouchDB(config.dbname);
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
                            return self._addRecord({source: source, data: data});
                        }
                        else{
                            //console.warn('Dbase error: ' , err);
                            deferred.reject(err);
                            return deferred.promise();
                        }
                    }
                    else { //overwrite existing
                        data._rev = doc._rev;
                        return self._addRecord({source: source, data: data});
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
            if (idarray.indexOf(this._records[i]._id) > -1) {
                returnArray.push(record);
            }
        }
        return returnArray;
    }, //returns all records, if ID array is filled, only return that records 
    _getRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == id) {
                return record;
            }
        }
    },
    _addRecord: function(config){
        var self = this;
        if (!config.source || !config.data){
            console.warn('Wrong input: ',config);
            return -1;
        }
        var promise = null;
        var source = config.source;
        var data = config.data;
        var existing = false;
        var record = self._recordproto();
        
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == data._id) {
                existing = true; //Already in list
                record = -1;
            }
        }
        if (!existing){
            if (this._db){
                promise = this._db_addRecord({source:source,data:data});
                //TODO: get _rev id from promise and add to record
            }
            else {console.warn('No IDB active for ', this._dbname);}
            record.inflate(data);
            self._records.push(record); //Adding to the list
        }
        return record;
    },
    _updateRecord: function(config){
        var self = this;
        if (!config.source || !config.data){
            console.warn('Wrong input: ',config);
            return -1;
        }
        var source = config.source;
        var data = config.data;
        var record = self._recordproto();
        var promise = null;
        if (this._db){
            promise = this._db_updateRecord({source:source, data: data});
            //TODO: get _rev id from promise and add to record
        }
        else {console.warn('No IDB active for ', this._dbname);}
        record.inflate(data);
        for (var i=0;i<this._records.length;i++){
            if (self._records[i]._id == record._id) {
                    self._records.splice(i,1,record);
            }
        }
       
        return record;
    },
    //Removing records is only useful if no local dbase is used among peers
    _removeRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            if (self._records[i]._id == id) {
                    self._records.splice(i,1);
                    return true;
            }
        }
        return false;
    }, 
    syncRecords: function(){} //Compare ID/status array from other peer with your list and returns requestlist and pushlist  
};

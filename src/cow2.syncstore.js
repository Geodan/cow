window.Cow = window.Cow || {};
Cow.db = function(){};
Cow.db.prototype = 
{ //pouchdb object
    //All these calls will be asynchronous and thus returning a promise instead of data
    _init: function(config){
        _db = new PouchDB(config.dbname);
    },
    _addRecord: function(config){
        var data = config.data;
        var source = config.source;
        data._id = data._id.toString();
        var deferred = jQuery.Deferred(); //TODO, remove jquery dependency
        switch (source){
            case 'UI': //New for sure, so we can use put
                _db.put(data, function(err, out){
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
                _db.post(data,function(err, out){
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
    _updateRecord: function(config){
        var data = config.data;
        if (!data._id){
            console.warn('No _id given. Old version client connected?');
            return(null);
        }
        var source = config.source;
        data._id = data._id.toString();
        var deferred = jQuery.Deferred(); //TODO, remove jquery dependency
        var promise;
        switch (source){
            case 'UI': 
                _db.get(data._id, function(err,doc){
                    if (err) {
                        if (err.reason == 'missing'){ //not really an error, just a notice that the record would be new
                            promise = _addRecord({source: source, data: data});
                        }
                        else{
                            //console.warn('Dbase error: ' , err);
                            deferred.reject(err);
                            promise = deferred.promise();
                        }
                    }
                    else { //overwrite existing
                        data._rev = doc._rev;
                        promise = _addRecord({source: source, data: data});
                    }
                });
                break;
            case 'WS':
                _db.put(data,function(err, out){
                    if (err) {
                        //console.warn('Dbase error: ' , err);
                        deferred.reject(err);
                    }
                    else {
                        deferred.resolve(out);
                    }
                    promise = deferred.promise();
                });
                break;
            default:
                console.warn('Wrong source type: ',source);
                return null;
        }
        return promise;
    
    },
    _getRecords: function(){
        var deferred = jQuery.Deferred();
        _db.allDocs({include_docs:true,descending: true}, function(err,doc){
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
    _getRecord: function(id){
        var deferred = jQuery.Deferred();
        _db.get(id, function(err,doc){
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
    _removeRecord: function(id){
        var deferred = jQuery.Deferred();
        _db.get(id, function(err,doc){
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
    } //returns promise
};


Cow.syncstore =  function(){}; //Synstore keeps track of records
Cow.syncstore.prototype = 
{
    _db: Object.create(Cow.db.prototype), 
    _records: [],
    getRecords: function(IDarray){}, //returns all records, if ID array is filled, only return that records 
    getRecord: function(ID){},
    addRecord: function(config){
        
    },
    updateRecord: function(config){},
    removeRecords: function(ID){},
    initRecords: function(){ //This will start the process of getting records from pouchdb (returns promise)
        _db._getRecords().done(function(recs){
             recs.forEach(function(d){
                     addRecord(d);
             });
        });
    }, 

    syncRecords: function(){} //Compare ID/status array from other peer with your list and returns requestlist and pushlist  
};

$.Cow.Store.prototype = {
    
    init: function(){
        var self = this;
        this._db = new PouchDB(this.dbname);
    },
    //Add record from UI
    addRecord_UI: function(data){
        data._id = data._id.toString();
        var deferred = jQuery.Deferred();
        this._db.put(data,function(err, out){
            if (err) {
                console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(out);
            }
        });
        return deferred.promise();
    },
    //Update record from UI
    updateRecord_UI: function(data){
        var self = this;
        var deferred = jQuery.Deferred();
        
        var put = function(data){
            self._db.put(data, function(err, response) {
                if (err) {
                    console.warn('Dbase error: ' , err);
                    deferred.reject(err);
                }
                else {
                    deferred.resolve(response);
                }
            });
        }
        
        this._db.get(data._id, function(err,doc){
            if (err) {
                if (err.reason = 'missing'){
                    put(data);
                }
                else{
                    console.warn('Dbase error: ' , err);
                    deferred.reject(err);
                }
            }
            else {
                data._rev = doc._rev;
                put(data);
            }
        });
        return deferred.promise();
    },
    //ADD RECORD FROM ws, TODO: include _rev
    addRecord_WS: function(data){
        var deferred = jQuery.Deferred();
        this._db.post(data,function(err, out){
            if (err) {
                console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(out);
            }
        });
        return deferred.promise();
    },
    //UPDATE RECORD FROM WS, TODO: include _rev
    updateRecord_WS: function(data){
        var deferred = jQuery.Deferred();
        this._db.put(data,function(err, out){
            if (err) {
                console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(out);
            }
        });
        return deferred.promise();
    },
    getRecords: function(){
        var deferred = jQuery.Deferred();
        this._db.allDocs({include_docs:true,descending: true}, function(err,doc){
            if (err) {
                console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc);
            }
        });
        return deferred.promise();
    },
    getRecord: function(id){
        var deferred = jQuery.Deferred();
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
    },
    removeRecord: function(id){
        var deferred = jQuery.Deferred();
        this._db.get(id, function(err,doc){
            if (err) {
                console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                db.remove(doc, function(err, response) {
                        deferred.resolve(response);
                });
            }
        });
        return deferred.promise();
    },
    bulkLoad_UI: function(d){
        var deferred = jQuery.Deferred();
        this._db.bulkDocs({docs:d},function(err,doc){
            if (err) {
                console.warn('Dbase error: ' , err);
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc);
            }
        });
        return deferred.promise();
    }
};

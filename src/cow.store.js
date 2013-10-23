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
    //Update record from U
    updateRecord_UI: function(data){
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
    }
};

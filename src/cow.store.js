$.Cow.Store.prototype = {
    
    init: function(){
        var self = this;
        this.lastchange = {};
        this._db = new PouchDB(this.dbname);
        /*Double db setup
        this._dbme = new PouchDB(this.dbname+'_me');
        this._dbthem = new PouchDB(this.dbname+'_them');
        var mechanges = db._dbme.changes({
            continuous: true,
            onChange: function(data){
                console.log('PDB Me changed ', data);
                //SEND TO ws
                //this.core.ws.sendData('pdb');
            }
        });
        var themchanges = db._dbthem.changes({
            continuous: true,
            onChange: function(data){
                console.log('PDB Them changed', data);
                
                //SEND TO ui
            }
        });
        this._dbme.replicate.to(this._dbthem, {
           continuous: true, 
           include_docs: true,
           onChange: function(d,x){
                console.log('Replicated to them',self.lastchange);
           }
        });
        this._dbme.replicate.from(this._dbthem, {
           continuous: true,
           include_docs: true,
           onChange: function(d,x){
                console.log('Replicated to me',d);
           }
        });
        */
    },
    //Add record from UI
    addRecord_UI: function(data){
        var deferred = jQuery.Deferred();
        this._db.post(data,function(err, out){
            if (err) {
                console.warn('Dbase error: ' + err.reason);
                deferred.reject('Dbase error: ' + err.reason);
            }
            else {
                deferred.resolve(out);
            }
        });
        return deferred.promise();
    },
    //Update record from U
    updateRecord_UI: function(data){
        this._db.put(data,function(err, out){
            if (err) {
                deferred.reject('Dbase error: ' + err.reason)
            }
            else {
                deferred.resolve(out);
            }
        });
        return deferred.promise();
    },
    addRecord_WS: function(data){
        this._db.post(data,function(err, out){
            if (err) {throw('Dbase error: ' + err.reason)};
            console.log(out);
        })
    },
    updateRecord_WS: function(data){
        this._db.put(data,function(err, out){
            if (err) {throw('Dbase error: ' + err.reason)};
            console.log(out);
        })
    },
    getRecords: function(){
        var deferred = jQuery.Deferred();
        this._db.allDocs({include_docs:true,descending: true}, function(err,docs){
            if (err) {
                deferred.reject('Dbase error: ' + err.reason)
            }
            else {
                deferred.resolve(docs);
            };
        });
        return deferred.promise();
    },
};

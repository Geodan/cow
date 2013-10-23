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
        this._db.put(data,function(err, out){
            if (err) {throw('Dbase error: ' + err)};
            self.lastchange = data;
            console.log(out);
        })
    },
    //Update record from U
    updateRecord_UI: function(data){
        this._db.put(data,function(err, out){
            if (err) {throw('Dbase error: ' + err)};
            console.log(out);
        })
    },
    addRecord_WS: function(data){
        this._db.post(data,function(err, out){
            if (err) {throw('Dbase error: ' + err)};
            console.log(out);
        })
    },
    updateRecord_WS: function(data){
        this._db.put(data,function(err, out){
            if (err) {throw('Dbase error: ' + err)};
            console.log(out);
        })
    },
    getRecords: function(){
        this._db.allDocs({include_docs:true,descending: true}, function(err,doc){
            if (err) {throw('Dbase error: ' + err)};
            console.log(doc);
        });
    },
};

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
Cow.localdb =  function(config, store){
    var self = this;
    this._store = store;
    this._records = store._records;
    this._dbname = config.dbname;
    this._core = config.core;
    this._disabled = config.noIDB;
};

Cow.localdb.prototype.init = function(){
    var self = this;
    return new Promise(function(resolve, reject){
        if (this._disabled){
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
            } ).done( function (s) {
                self._db = s;
                resolve();
            });
        }
    });
};

Cow.localdb.prototype.getRecords = function(){
    var self = this;
    return new Promise(function(resolve, reject){
       self._db.main.query().filter().execute().done(function(doc){
            resolve(doc);
       }).fail(function(e){
            reject(e);
       });
    });
};  //returns promise

Cow.localdb.prototype.write = function(config){
    var data = config.data;
    var source = config.source;
    data._id = data._id.toString();
    var self = this;
    var db = this._db;
    return new Promise(function(resolve, reject){
        db.main.remove(data._id).done(function(){
            console.log('Skipping');
            resolve(data);
            db.main.add(data).done(function(d){
                resolve(d);
            }).fail(function(d,e){
                console.warn(e.target.error.message,d);
                reject(e);
            });
        }).fail(function(e){
            console.warn(e);
            reject(e);
        });
    });
};

Cow.localdb.prototype.clear = function(){
        var self = this;
        return new Promise(function(resolve, reject){
            self.db.main.clear().then(function(){
                    resolve(); //empty dbase from items
            });
        });
};

}).call(this);
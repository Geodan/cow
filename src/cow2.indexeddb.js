(function(){

var root = this;
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Cow || {};
    }
    exports.Cow = Cow || {}; 
} else {
    if (typeof(Cow) == 'undefined') {
        root.Cow = {};
    }
    else {
        root.Cow = Cow;
    }
}


Cow.localdb = function(config){
    var self = this;
    this._dbname = config.dbname;
    this._core = config.core;
    this._db = null;
};

Cow.localdb.prototype.open  = function(){
    var self = this;
    var version = 2;
    var promise = new Promise(function(resolve, reject){    
        var request = indexedDB.open(self._dbname,version);
        request.onerror = function(event) {
          reject(event.target.error);
        };
        request.onupgradeneeded = function(event) {
          var db = event.target.result;
          db
            .createObjectStore("users", { keyPath: "_id" })
            .createIndex("name", "name", { unique: false });
          db
            .createObjectStore("projects", { keyPath: "_id" })
            .createIndex("name", "name", { unique: false });
          db
            .createObjectStore("socketservers", { keyPath: "_id" });
          db
            .createObjectStore("items", { keyPath: "_id" })
            .createIndex("projectid", "projectid", { unique: false });
          db
            .createObjectStore("groups", { keyPath: "_id" })
            .createIndex("projectid", "projectid", { unique: false });
        };
        request.onsuccess = function(event) {
            self._db = event.target.result;
            resolve(); //We're not sending back the result since we handle the db as private
        };
    });
    return promise;
};

Cow.localdb.prototype.write = function(config){
    var storename = config.storename;
    var record = config.data;
    var projectid = config.projectid;
    record._id = record._id.toString();
    record.projectid = projectid;
    var trans = this._db.transaction([storename], "readwrite");
    var store = trans.objectStore(storename);
    var promise = new Promise(function(resolve, reject){
        var request = store.put(record);
        request.onsuccess = function(e) {
            resolve(request.result);
        };
        request.onerror = function(e) {
            console.log(e.value);
            reject("Couldn't add the passed item");
        };
    });
    return promise;
};

Cow.localdb.prototype.getRecord = function(config){
    var storename = config.storename;
    var id = config.id;
    
    var trans = this._db.transaction([storename]);
    var store = trans.objectStore(storename);
    var promise = new Promise(function(resolve, reject){
            var request = store.get(id);
            request.onsuccess = function(){
                resolve(request.result);
            };
            request.onerror = function(d){
                reject(d);
            };
    });
    return promise;
};

Cow.localdb.prototype.getRecords = function(config){
    var now = new Date();
    
    var storename = config.storename;
    var projectid = config.projectid;
    console.log(now.toLocaleTimeString(), now.getMilliseconds(),'Getting records from ' + storename + ' proj. ' + projectid);
    var key,index = undefined;
    var trans = this._db.transaction([storename]);
    var store = trans.objectStore(storename);
    if (projectid){
        key = IDBKeyRange.only(projectid);
        index = store.index("projectid");
    }
    else {
        index = store;
    }
    var promise = new Promise(function(resolve, reject){
        var result = [];
        var request = index.openCursor(key);
        request.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          }
          else{
              var now = new Date();
              console.log(now.toLocaleTimeString(), now.getMilliseconds(),'Got ' + result.length + ' records from ' + storename + ' proj. ' + projectid);
              resolve(result);
          }
        };
        request.onerror = function(e){
            reject(e);
        };
    });
    return promise;
};

Cow.localdb.prototype.clear = function(config,projectid){
    //TODO, returns promise
};

}).call(this);
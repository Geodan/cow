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
    var version = 2;
    this._openpromise = new Promise(function(resolve, reject){    
        var request = indexedDB.open(self._dbname,version);
        request.onupgradeneeded = function(event) {
          console.log('Indexeddb initialized/upgraded');
          var db = event.target.result;
          
          //Deleting DB if already exists
          
          if(db.objectStoreNames.contains("users")) {
                db.deleteObjectStore("users");
          }
          if(db.objectStoreNames.contains("projects")) {
                db.deleteObjectStore("projects");
          }
          if(db.objectStoreNames.contains("socketservers")) {
                db.deleteObjectStore("socketservers");
          }
          if(db.objectStoreNames.contains("items")) {
                db.deleteObjectStore("items");
          }
          if(db.objectStoreNames.contains("groups")) {
                db.deleteObjectStore("groups");
          }
          
          db
            .createObjectStore("users", { keyPath: "_id" });
            //.createIndex("updated", "updated", { unique: false });
          db
            .createObjectStore("projects", { keyPath: "_id" });
            //.createIndex("updated", "updated", { unique: false });
          db
            .createObjectStore("socketservers", { keyPath: "_id" });
            //.createIndex("updated", "updated", { unique: false });
          db
            .createObjectStore("items", { keyPath: "_id" })
            //.createIndex("updated", "updated", { unique: false })
            .createIndex("projectid", "projectid", { unique: false });
          db
            .createObjectStore("groups", { keyPath: "_id" })
            //.createIndex("updated", "updated", { unique: false })
            .createIndex("projectid", "projectid", { unique: false });
        };
        request.onsuccess = function(event) {
            self._db = event.target.result;
            resolve(); //We're not sending back the result since we handle the db as private
        };
    });
};

Cow.localdb.prototype.write = function(config){
    var self = this;
    var storename = config.storename;
    var record = config.data;
    var projectid = config.projectid;
    record._id = record._id.toString();
    record.projectid = projectid;
    
    var promise = new Promise(function(resolve, reject){
        var trans = self._db.transaction([storename], "readwrite");
        trans.onabort = function(e){
            console.warn('Abort error');
        };
        var store = trans.objectStore(storename);
        //parse / stringify will remove artifacts from other libs
        var request = store.put(JSON.parse(JSON.stringify(record)));
        request.onsuccess = function(e) {
            resolve(request.result);
        };
        request.onerror = function(e) {
            console.warn('IDB Error: ',e.value);
            reject("Couldn't add the passed item");
        };
    });
    return promise;
};

Cow.localdb.prototype.writeAll = function(config){
    var self = this;
    var storename = config.storename;
    var list = config.data;
    var projectid = config.projectid;
    var promise = new Promise(function(resolve, reject){
        var trans = self._db.transaction([storename], "readwrite");
        trans.onabort = function(e){
            console.warn('Abort error');
            reject();
        };
        var store = trans.objectStore(storename);
        for (var i = 0;i< list.length;i++){
            var record = list[i];
            record._id = record._id.toString();
            record.projectid = projectid;
            //parse / stringify will remove artifacts from other libs
            var request = store.put(JSON.parse(JSON.stringify(record)));
        	request.onsuccess = function(e) {
                //continue
            };
            request.onerror = function(e) {
                console.warn('IDB Error: ',e.value);
                reject("Couldn't add the passed item");
            };
        }
        resolve();
    });
    return promise;
};

Cow.localdb.prototype.getRecord = function(config){
    var self = this;
    var storename = config.storename;
    var id = config.id;
    var promise = new Promise(function(resolve, reject){
            var trans = self._db.transaction([storename]);
            trans.onabort = function(e){
                console.warn('Abort error');
            };
            var store = trans.objectStore(storename);

            var request = store.get(id);
            request.onsuccess = function(){
                resolve(request.result);
            };
            request.onerror = function(e){
                console.warn('IDB Error: ',e.value);
                reject(e);
            };
    });
    return promise;
};

Cow.localdb.prototype.getRecords = function(config){
    var storename = config.storename;
    var projectid = config.projectid;
    
    var key,index;
    var trans = this._db.transaction([storename]);
    trans.onabort = function(e){
        console.warn('Abort error');
    };
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
        var request;
        if (key){ //Solution to make it work on IE, since openCursor(undefined) gives an error
            request = index.openCursor(key);
        }
        else{
            request = index.openCursor();
        }
        request.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          }
          else{
              //console.log(result.length, storename, 'in', projectid);
              resolve(result);
          }
        };
        request.onerror = function(e){
            console.warn('IDB Error: ',e.value);
            reject(e);
        };
    });
    return promise;
};

Cow.localdb.prototype.delRecord = function(config){
    var self = this;
    var storename = config.storename;
    var projectid = config.projectid;
    var id = config.id;
    var promise = new Promise(function(resolve, reject){
        var trans = self._db.transaction([storename], "readwrite");
        trans.onabort = function(e){
            console.warn('Abort error');
        };
        var store = trans.objectStore(storename);
        var request = store.delete(id);
        request.onsuccess = function(event){
            resolve();
        };
        request.onerror = function(e){
            console.warn('IDB Error: ',e.value);
            reject(e);
        };
    });
    return promise;
};

Cow.localdb.prototype.clear = function(config){
    var storename = config.storename;
    var projectid = config.projectid;
    var key,index;
    var trans = this._db.transaction([storename], "readwrite");
    trans.onabort = function(e){
        console.warn('Abort error');
    };
    var store = trans.objectStore(storename);
    if (projectid){
        key = IDBKeyRange.only(projectid);
        index = store.index("projectid");
    }
    else {
        index = store;
    }
    var promise = new Promise(function(resolve, reject){
        var request;
        if (key){ //Solution to make it work on IE, since openCursor(undefined) gives an error
            request = index.openCursor(key);
        }
        else{
            request = index.openCursor();
        }
        request.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            store.delete(cursor.primaryKey);
            cursor.continue();
          }
          else{
              resolve();
          }
        };
        request.onerror = function(e){
            console.warn('IDB Error: ',e.value);
            reject(e);
        };
    });
    return promise;
};

}).call(this);
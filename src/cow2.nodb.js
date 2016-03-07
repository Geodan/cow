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
    
    var dbUrl = "NO DB WILL BE USED";
    if (!dbUrl){
    	throw('No global dbUrl set. Should be like: "tcp://user:pass@ip/dir"');
    }
    this._schema = self._dbname;
    this._openpromise = new Promise(function(resolve, reject){
        resolve();
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
          resolve();
    });
    return promise;
};

//This is different from the idb approach since we don't care about the transaction in postgres
//We just redirect every record to a .write function
Cow.localdb.prototype.writeAll = function(config){
    var self = this;
    var storename = config.storename;
    var list = config.data;
    var projectid = config.projectid;
    var promisearray = [];
    for (var i = 0;i< list.length;i++){
        var record = list[i];
        var subpromise = this.write({
            storename: storename,
            projectid: projectid,
            data: record
        });
        promisearray.push(subpromise);
    }
    var promise = Promise.all(promisearray);
    return promise;
};

Cow.localdb.prototype.getRecord = function(config){
    var self = this;
    var storename = config.storename;
    var id = config.id;
    
    var promise = new Promise(function(resolve, reject){
          resolve();
    });
    return promise;
    
};

Cow.localdb.prototype.getRecords = function(config){
    var self = this;
    var storename = config.storename;
    var projectid = config.projectid;
    var query;

    var promise = new Promise(function(resolve, reject){
        resolve([]);
    });
    return promise;
};

Cow.localdb.prototype.delRecord = function(config){
    var promise = new Promise(function(resolve, reject){
            //console.warn('delRecord not used with postgres');
            reject();
    });
    return promise;
};

}).call(this);
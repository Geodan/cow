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
    //var dbUrl = "tcp://osgis:osgis@osgis.geodan.nl/osgis2";
    var dbUrl = "tcp://geodan:Gehijm@192.168.24.15/cow";
    this._schema = self._dbname;
    this._openpromise = new Promise(function(resolve, reject){
        var request = pg.connect(dbUrl, function(err, client) {
                
                if (err){
                    console.log(err);
                    reject(err);
                }
                self._db = client;
                
                var create_schema = 'CREATE SCHEMA IF NOT EXISTS ' + self._schema;
                client.query(create_schema, function(err, result){
                    if (err){
                        console.log(err);
                        reject(err); 
                        return;
                    }
                });
                
                var stores = ['users','projects', 'socketservers', 'items', 'groups'];
                for (var i=0;i<stores.length;i++){
                    
                  var create_users = //'DROP TABLE IF EXISTS '+ self._schema+'.'+stores[i]+'; ' + 
                    'CREATE TABLE IF NOT EXISTS '+ self._schema+'.'+stores[i]+' (' + 
                    '_id text NOT NULL, ' +
                    '"dirty" boolean,' +
                    '"deleted" boolean,' +
                    '"created" bigint,' +
                    '"updated" bigint,' +
                    '"data" json,'+
                    '"deltas" json,' +
                    '"projectid" text' +
                    ');'; 
                  client.query(create_users, function(err, result){
                        if (err){
                            console.log(err);
                            reject(err); 
                            return;
                        }
                  });
                }
                client.on('notification', function(data) {
                    var table = data.payload;
                    console.log(table, ' has been changed in the database');
                    switch(table) {
                    case 'users':
                        self._core.userStore()._loadFromDb().then(
                            function(){
                                self._core.userStore().sync();
                                console.log('loaded');
                            },function(err){
                                console.log('Error: ', err);
                            });
                        break;
                    default:
                        console.warn('Update from unknown table: ', table);
                    }
                });
                client.query("LISTEN watchers");
                resolve();
        });
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
          var query = "DELETE FROM "+self._schema+"." + storename + " WHERE _id = '"+record._id+"';";
          self._db.query(query, function(err, result){
              if (err){
                    console.log(err, query);
                    reject(err);
              }
              query = "INSERT INTO "+self._schema+"." + storename + " VALUES($1, $2, $3, $4, $5, $6, $7, $8)";
              var vars = [
                record._id,
                record.dirty, 
                record.deleted, 
                record.created, 
                record.updated, 
                JSON.stringify(record.data), 
                JSON.stringify(record.deltas), 
                record.projectid
                ]; 
              self._db.query(query, vars, function(err, result){
                if (err){
                    console.log(err, query);
                    reject(err);
                }
                resolve();
              });
          });
    });
    return promise;
};

Cow.localdb.prototype.getRecord = function(config){
    var self = this;
    var storename = config.storename;
    var id = config.id;
    
    var promise = new Promise(function(resolve, reject){
            var query = "SELECT * FROM "+self._schema+"." + storename + " WHERE _id = '"+id+"';";
            self._db.query(query, function(err, result){
              if (err){
                    //console.log(err, query);
                    reject(err);
                    return;
              }
              var row = result.rows[0];
              //console.log(row);
              resolve(row);
            });
    });
    return promise;
    
};

Cow.localdb.prototype.getRecords = function(config){
    var self = this;
    var storename = config.storename;
    var projectid = config.projectid;
    var query;
    if (projectid){
        query = "SELECT * FROM "+this._schema+"." + storename + " WHERE projectid = '"+projectid+"';";
    }
    else {
        query = "SELECT * FROM "+this._schema+"." + storename + ";";
    }
    var promise = new Promise(function(resolve, reject){
        self._db.query(query, function(err,result){
                if (err){
                    reject(err);
                }
                else {
                    resolve(result.rows);
                }
          });
    });
    return promise;
};

Cow.localdb.prototype.delRecord = function(config){
    var promise = new Promise(function(resolve, reject){
            console.warn('delRecord not used with postgres');
            reject();
    });
    return promise;
};

}).call(this);
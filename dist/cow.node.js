(function(){

// Create local references to array methods we'll want to use later.
var array = [];
var push = array.push;
var slice = array.slice;
var splice = array.splice;

// Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events =  {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      //console.log('Trigger! : ',name);
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };
  
  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;
  
    var root = this;
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
          exports = module.exports = Events;
        }
        exports.Events = Events;
    } else {
        root.Events = Events;
    }
  
}.call(this));
var Cow = {};

(function(){

var root = this;
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Cow || {};
    }
    exports.Cow = Cow || {}; 
} else {
    root.Cow = Cow || {};
    root._ = _;
}

Cow.utils = {
    //Generate a unique id
    idgen: function(){
        return 'ID'+(Math.random() * 1e16).toString();
    }
};
}.call(this));
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

Cow.record = function(){
    //FIXME: 'this' object is being overwritten by its children
    this._id    = null  || new Date().getTime().toString();
    this._dirty = false;
    this._ttl = null;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
};
Cow.record.prototype =
{
    sync: function(){
    	if (this._dirty){
			var now = new Date().getTime();
			var userid = this._store._core.user() ? this._store._core.user().id() : null;
			//TT: dirty should be enough to add delta //if ( _(this._deltaq).size() > 0 && !this._store.noDeltas){ //avoid empty deltas
			if ( this._dirty && !this._store.noDeltas){ //avoid empty deltas
				this.deltas(now, this._deltaq, this._deleted, userid); //add deltas from queue
			}
			this._deltaq = {}; //reset deltaq
			return this._store.syncRecord(this);
		}
		else {
			console.log('Not syncing because record not dirty');
			return this;
		}
    },

    id: function(x){
        if (x){
            console.warn("You can't set an id afterwards, that only happens when object is created (ignoring)");
        }
        return this._id.toString();
    },
    /**
        created() - returns the timestamp of creation
    **/
    created: function(x){
        if (x){
            console.warn("You can't set creation date afterwards. (ignoring)");
        };
        return this._created;
    },
    /**
    	creator() - returns the user that created the item
    **/
    creator: function(){
    	var creator;
    	if (this._deltas.length > 0 && this._deltas[0].userid){
    		creator = this._store._core.users(this._deltas[0].userid.toString());
    	}
    	return creator;
    },
    /**
    	updater() - returns the user that last updated the item
    	updater(timestamp) - returns the user that updated the item at or before that time
    **/
    updater: function(timestamp){
    	if (timestamp){
    		return this.updater_on(timestamp);
    	}
    	else { //get last updater
			if (this._deltas.length > 0 && this._deltas[this._deltas.length -1].userid){
				var updaterid = this._deltas[this._deltas.length -1].userid;
				return this._store._core.users(updaterid.toString());
			}
			return null;
    	}
    },
    /**
        updated() - returns the timestamp of last update
        updated(timestamp) - sets the updated time to timestamp, returns record
    **/
    updated: function(timestamp){
        if (timestamp) {
            this._updated = timestamp;
            return this;
        }
        else {
            return this._updated;
        }
    },
    /**
        touch() - reset the update time to now, returns record
    **/
    touch: function(){
        this.updated(new Date().getTime());
        this._dirty = true;
        return this;
    },
    /**
        deleted() - returns current deleted status (boolean)
        deleted(timestamp) - returns the deleted status at given timestamp (boolean)
        deleted(boolean) - sets the deleted status, returns record (object)
    **/
    deleted: function(truefalse){
        if (truefalse !== undefined && typeof(truefalse) == 'boolean'){
        	//only updated when changed
        	if (this._deleted !== truefalse){
				this._deleted = truefalse;
				this.updated(new Date().getTime()); //TT: added this because otherwhise deleted objects do not sync
				this._dirty = true;
			}
            return this;
        }
        //if a timestamp instead of boolean is given
        else if (truefalse !== undefined && typeof(truefalse) == 'number'){
            return this.deleted_on(truefalse);
        }
        else {
            return this._deleted;
        }
    },
    /**
        dirty() - returns the dirty status (boolean)
        dirty(boolean) - sets the dirty status, returns record
    **/
    dirty: function(truefalse){
        if (truefalse !== undefined){
        	//only updated when changed
        	if (this._dirty !== truefalse){
        		this._dirty = truefalse;
        		this.updated(new Date().getTime());
        	}
            return this;
        }
        else {
            return this._dirty;
        }
    },
    /**
    	ttl() - returns the timetolive in milliseconds
    	ttl(int) - sets the timetolive in milliseconds, returns record
    **/
    ttl: function(time){
    	if (time !== undefined){
    		if (this._ttl !== time){
    			this._ttl = time;
    		}
    		return this;
    	}
    	else {
    		return this._ttl;
    	}
    },
    /**
    	expired() - returns boolean whether record is past ttl
    **/
    expired: function(){
    	var staleness = new Date().getTime() - this.updated();
    	if (this._ttl && staleness > this._ttl){
    		return true
    	}
    	else {
    		return false;
    	}
    },
    /**
        data() - returns data object
        data(timestamp) - returns data object on specific time
        data(param) - returns value of data param (only 1 deep)
        data(param, value) - sets value of data param and returns record (only 1 deep)
        data(object) - sets data to object and returns record
    **/
    data: function(param, value){
        if (!param){
            if (typeof(this._data) == 'object'){
                return JSON.parse(JSON.stringify(this._data));//TT: ehm... why do we do this?!
            }
            return this._data;
        }
        else if (param && typeof(param) == 'object' && !value){
            //overwriting any existing data
            this._data = param;
            this._deltaq = param;
            this.dirty(true);
            return this;
        }
        else if (param && typeof(param) == 'string' && typeof(value) == 'undefined'){
            return this._data[param];
        }
        else if (param && typeof(param) == 'number' && typeof(value) == 'undefined'){
            return this.data_on(param);
        }
        else if (param && typeof(value) != 'undefined'){
            if (typeof(value) == 'object'){
                value = JSON.parse(JSON.stringify(value));
            }
            //only updated when changed
            if (this._data[param] != value){ 
            	this._data[param] = value;
            	this._deltaq[param] = value;
            	this.dirty(true);
            }
            return this;
        }
    },
    /**
        data_on(timestamp) - same as data(timestamp)
    **/
    data_on: function(timestamp){
        //If request is older than feature itself, disregard
        if (timestamp < this._created){
            return null; //nodata
        }
        //If request is younger than last feature update, return normal data
        else if (timestamp > this._updated){
            return this.data();
        }
        else {
            //Recreate the data based on deltas
            var returnval = {};
            var deltas = _.sortBy(this.deltas(), function(d){return d.timestamp;});
            deltas.forEach(function(d){
                if (d.timestamp <= timestamp){
                    _.extend(returnval, d.data);
                }
            });
            return returnval;
        }
    },
    /**
        deleted_on(timestamp) - same as deleted(timestamp)
    **/
    deleted_on: function(timestamp){
        //If request is older than feature itself, disregard
        if (timestamp < this._created){
            return null; //nodata
        }
        //If request is younger than last feature update, return normal deleted
        else if (timestamp > this._updated){
            return this.deleted();
        }
        else {
            //Recreate the deleted status based on deltas
            var returnval = {};
            var deltas = _.sortBy(this.deltas(), function(d){return d.timestamp;});
            deltas.forEach(function(d){
                if (d.timestamp <= timestamp){
                    returnval = d.deleted;
                }
            });
            return returnval;
        }
    },
    /**
        updater_on(timestamp) - same as updater(timestamp)
    **/
    updater_on: function(timestamp){
        //If request is older than feature itself, disregard
        if (timestamp < this._created){
            return null; //nodata
        }
        //If request is younger than last feature update, return normal updater
        else if (timestamp > this._updated){
            return this.updater();
        }
        else {
            //get the updater from the deltas
            var deltas = _.sortBy(this.deltas(), function(d){return d.timestamp;});
            deltas.forEach(function(d){
                if (d.timestamp <= timestamp){
                    //FIXME: return the updater
                }
            });
            return null; //no data found
        }
    },
    /**
        Deltas are written at the moment of sync, only to be used from client API

        deltas() - returns array of all deltas objects
        deltas(time) - returns deltas object from specific time
        deltas(time, data) - adds a new deltas objects (only done at sync)
    **/
    deltas: function(time, data, deleted, userid){
        if (!time){
            return this._deltas.sort(function(a, b) {
			  return a.timestamp - b.timestamp;
			});
        }
        else if (time && !data){
            for (var i = 0;i<this._deltas.length;i++){
                if (this._deltas[i].timestamp == time) {
                    return this._deltas[i];
                }
            }
            return null;
        }
        else if (time && data){
            var existing = false;
            for (var j = 0;j<this._deltas.length;j++){
                if (this._deltas[j].timestamp == time) {
                    existing = true;
                }
            }
            if (!existing){
                this._deltas.push({
                        timestamp: time,
                        data: data,
                        userid: userid,
                        deleted: deleted
                });
            }
            return this;
        }

    },
    /**
        deflate() - create a json out of a record object
    **/
    deflate: function(){
        return {
            _id: this._id,
            dirty: this._dirty,
            ttl: this._ttl,
            created: this._created,
            deleted: this._deleted,
            updated: this._updated,
            data: this._data,
            deltas: this._deltas
        };
    },
    /**
        inflate(config) - create a record object out of json
    **/
    inflate: function(config){
        this._id = config._id || this._id;
        if (config.dirty !== undefined){
            this._dirty = config.dirty;
        }
        this._ttl = config.ttl || this._ttl;
        this._created = config.created || this._created;
        if (config.deleted !== undefined){
            this._deleted = config.deleted;
        }
        this._updated = config.updated || this._updated;
        this._data = config.data || this._data || {warn:'empty inflate'};
        if (!this._store.noDeltas){ //only inflate deltas when enabled
            this._deltaq = this._deltaq || {}; //FIXME: workaround for non working prototype (see top)
            this._deltasforupload = this._deltasforupload || {}; //FIXME: same here
            //deltas gets special treatment since it's an array that can be enlarged instead of overwritten
            this._deltas = this._deltas || [];
            if (config.deltas){
                for (var i = 0; i < config.deltas.length;i++){
                    var time = config.deltas[i].timestamp;
                    var data = config.deltas[i].data;
                    var deleted = config.deltas[i].deleted;
                    var userid = config.deltas[i].userid;
                    this.deltas(time, data, deleted, userid);
                }
            }
        }
        return this;
    }

};
//Adding some Backbone event binding functionality to the record
_.extend(Cow.record.prototype, Events);
}.call(this));

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
    //var dbUrl = "tcp://geodan:Gehijm@192.168.24.15/cow";
    if (!dbUrl){
    	throw('No global dbUrl set. Should be like: "tcp://user:pass@ip/dir"');
    }
    this._schema = self._dbname;
    this._openpromise = new Promise(function(resolve, reject){
        pg.on('error', function (err) {
          console.log('Database error!', err);
        });
        var request = pg.connect(dbUrl, function(err, client) {
                
                if (err){
                    console.log('meeh',err);
                    reject(err);
                    return;
                }
                self._db = client;
                
                
                var create_schema = 'CREATE SCHEMA IF NOT EXISTS ' + self._schema;
                client.query(create_schema, function(err, result){
                    if (err){
                        console.log('meeh',err);
                        reject(err); 
                        return;
                    }
                });
                
                var stores = ['users','projects', 'socketservers', 'items', 'groups'];
                for (var i=0;i<stores.length;i++){
                    
                  var create_table = //'DROP TABLE IF EXISTS '+ self._schema+'.'+stores[i]+'; ' + 
                    'CREATE TABLE IF NOT EXISTS '+ self._schema+'.'+stores[i]+' (' + 
                    '_id text NOT NULL, ' +
                    '"dirty" boolean,' +
                    '"deleted" boolean,' +
                    '"created" bigint,' +
                    '"updated" bigint,' +
                    '"data" json,'+
                    '"deltas" json,' +
                    '"projectid" text,' +
                    ' CONSTRAINT '+stores[i]+'_pkey PRIMARY KEY (_id)' + 
                    ');'; 
                  client.query(create_table, function(err, result){
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
                    console.log('meeh',err);
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
            //console.warn('delRecord not used with postgres');
            reject();
    });
    return promise;
};

}).call(this);
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
Cow.syncstore =  function(config){
    var self = this;
    this._storename = config.dbname;
    this._isloaded = false; //Used in messenger.js to check if store is loaded (workaround)
    this._core = config.core;
    this.noDeltas = config.noDeltas || false;
    this.noIDB = config.noIDB || false;
    this._maxAge = config.maxAge; 
    this.syncinfo = {
        toReceive: [],
        toSent: [],
        received: 0,
        send: 0
    };
    if (!this.noIDB){
        this.localdb = this._core.localdb();//new Cow.localdb(config, this);
        this._commitqueue = {
            storename:this._storename,
            projectid: this._projectid,
            data: []
        };
    }
    this.loaded = new Promise(function(resolve, reject){
        if (self.localdb){
            self._core.dbopen()
              .then(function(){
                self.localdb.getRecords({
                        storename: self._storename,
                        projectid: self._projectid
                    })
                  .then(function(rows){

                    rows.forEach(function(d){
                         var record = self._recordproto(d._id);
                         record.inflate(d);
                         var lastupdate = record.updated();
                         var now = new Date().getTime();
                         var staleness = now - lastupdate;
                         var existing = false;
                         //Not likely to exist in the _records at this time but better safe then sorry..
                         for (var i=0;i<self._records.length;i++){
                            if (self._records[i]._id == record._id) {
                                existing = true; //Already in list
                                //record = -1;
                            }
                         }//Object should be non existing yet and not older than some max setting
                         if (!existing && (staleness <= record._ttl || self._ttl === null)){
                             self._records.push(record); //Adding to the list
                         }
                         //If it is stale, than remove it from the database
                         if(record._ttl && staleness > record._ttl){
                             self.localdb.delRecord({
                                storename:self._storename,
                                projectid: self._projectid,
                                id: record._id
                             });
                         }
                     });
                    self.trigger('datachange');
                    self._isloaded = true;
                    resolve();
                },function(d){
                    console.warn('DB Fail');
                    reject(d);
                });
            }, function(d){
                console.warn('DB Fail');
                reject(d);
            });
        }
        else { //NO localdb, so nothing to load and we're done immediately
            self._isloaded = true;
            resolve();
        }
    });
    this.synced = new Promise(function(resolve, reject){
        self.loaded.then(function(){
            self.on('synced', function(){
                    resolve();
            });
            //self.sync(); //disabled sync here because we want to wait for all the stores to be synced
        });
        self.loaded.catch(function(e){
            console.error(e.message);
            reject();
        });
    });
};
/**
    See for use of promises:
        1. http://www.html5rocks.com/en/tutorials/es6/promises/
        2. https://github.com/jakearchibald/ES6-Promises
**/

Cow.syncstore.prototype =
{
    /** NOT USED AT THE MOMENT **/
    /*
    _db_getRecord: function(id){
        var self = this;
        return new Promise(function(resolve, reject){
            self._db.main.query().filter('_id',id).execute().done(function(doc){
                resolve(doc);
            }).fail(function(doc){
                reject(doc);
            });
        });
    }, //returns promise
    */
    /** NOT USED AT THE MOMENT **/
    /*
    _db_removeRecord: function(id){
        var self = this;
        return new Promise(function(resolve, reject){
             db.main.remove(data._id).done(function(){
                 resolve();
             }).fail(function(){
                 reject();
             });
        });
      }, //returns promise
      */
      /**
        _loadFromDb() - This will start the process of getting records from db (returns promise)
            experimental, used for nodejs client
      **/

    _loadFromDb: function(){
        var self = this;
        return new Promise(function(resolve, reject){
            self.localdb.getRecords({
                    storename: self._storename,
                    projectid: self._projectid
                })
              .then(function(rows){

                rows.forEach(function(d){
                     var record = self._recordproto(d._id);
                     record.inflate(d);
                     var lastupdate = record.updated();
                     var now = new Date().getTime();
                     var staleness = now - lastupdate;
                     var existing = false;
                     //Not likely to exist in the _records at this time but better safe then sorry..
                     for (var i=0;i<self._records.length;i++){
                         //Object exists but is newer (only happens if localdb is updated from outside
                        if (self._records[i]._id == record._id && self._records[i]._updated < record._updated) {
                            self._records.splice(i,1,record); //replace with new
                            existing = true; //Already in list
                        }
                        else if (self._records[i]._id == record._id && self._records[i]._updated >= record._updated) {
                            existing = true; //Already in list
                            //record = -1;
                        }
                     }//Object should be non existing yet and not older than some max setting
                     if (!existing && (staleness <= record._ttl || record._ttl === null)){
                         self._records.push(record); //Adding to the list
                     }
                     //If it is stale, than remove it from the database
                     else if(record._ttl && staleness > record._ttl){
                         self.localdb.delRecord({
                            storename:self._storename,
                            projectid: self._projectid,
                            id: record._id
                         });
                     }
                 });
                self.trigger('datachange');
                resolve();
            },function(d){
                console.warn('DB Fail');
                reject(d);
            });
        });
     },

    //_getRecords([<string>]) - return all records, if ID array is filled, only return that records
    _getRecords: function(idarray){
        var returnArray = [];
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (idarray.indexOf(record._id) > -1) {
                returnArray.push(record);
            }
        }
        return returnArray;
    },
    //_getRecord(<string>) - return record or create new one based on id
    _getRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record._id == id) {
                return record;
            }
        }
        //var config = {_id: id};
        //return this._addRecord({source: 'UI', data: config}).dirty(true);
        //TODO: rethink this strategy: should we make a new record on non-existing or just return null
        return null;
    },
    /**
    _addRecord - creates a new record or replaces an existing one with the same _id
        when the source is 'WS' it immidiately sends to the local, if not the record needs a manual record.sync()
    **/
    _addRecord: function(config){
        if (!config.source || !config.data){
            console.warn('Wrong input: ' + config);
            return false;
        }
        var promise = null;
        var source = config.source;
        var data = config.data;
        var existing = false;
        var record;
        //Check to see if the record is existing or new
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == data._id) {
                existing = true; //Already in list
                record = this._records[i];
                record.inflate(data);
                //record.deleted(false); //set undeleted //TT: disabled, since this gives a problem when a record from WS comes in as deleted
                if (this.localdb && source == 'WS'){ //update the db
                	//Disabled because new way of adding records by first adding them to a commitqueue
                    //this.localdb.write({
                    //    storename:this._storename,
                    //    projectid: this._projectid,
                    //    data:record.deflate()
                    //});
                    this._commitqueue.data.push(record.deflate());
                }
            }
        }
        if (!existing){
            //Create a new record and inflate with the data we got
            record = this._recordproto(data._id);
            record.inflate(data);
            if (this.localdb && source == 'WS'){
            	//Disabled because New way of adding records by first adding them to a commitqueue
                //this.localdb.write({
                //    storename:this._storename,
                //    projectid: this._projectid,
                //    data:record.deflate()
                //});
                this._commitqueue.data.push(record.deflate());
            }
            this._records.push(record); //Adding to the list
            //console.log(this._records.length);
        }
        record.trigger('datachange');
        return record;
    },
    /**
        _commit() - sends the commitqueue to the idb
    **/
    _commit: function(){
        if (!this.noIDB && this._commitqueue.data.length > 0){
            //console.log('starting commit for ', this._commitqueue.data.length, this._storename);
            this._commitqueue.projectid = this._projectid;
            this.localdb.writeAll(this._commitqueue);
            this._commitqueue.data = [];
        }

    },

    /**
        _getRecordsOn(timestamp) -
    **/
    _getRecordsOn: function(timestamp){
        var returnarr = [];
        this._records.forEach(function(d){
            //If request is older than feature itself, disregard
            if (timestamp < d._created){
                //don't add
            }
            //If request is younger than or same as last feature update, return normal data
            else if (timestamp >= d._updated){
                returnarr.push(d);
            }
            else if (d.data(timestamp)){
                returnarr.push(d); //TODO: hier gebleven
            }
        });
        return returnarr;
    },
   /**
        Only to be used from client API

        records() - returns array of all records
        records(timestamp) - returns array of records created before timestamp
        records(id) - returns record with id (or null)
        records([id]) - returns array of records from id array
        records({config}) - creates and returns record
    **/

    records: function(config){
        if (config && Array.isArray(config)){
            return this._getRecords(config);
        }
        else if (config && typeof(config) == 'object'){
            return this._addRecord({source: 'UI', data: config}).dirty(true);
        }
        else if (config && typeof(config) == 'string'){
            return this._getRecord(config);
        }
        else if (config && typeof(config) == 'number'){
            return this._getRecordsOn(config);
        }
        else{
            return this._records;
        }
    },
    //Removing records is only useful if no local dbase is used among peers
    _removeRecord: function(id){
        for (var i=0;i<this._records.length;i++){
            if (this._records[i]._id == id) {
                    this._records.splice(i,1);
                    //this.trigger('datachange');
                    return true;
            }
        }
        return false;
    },
    /**
        clear() - remove all records, generally not useful since other peers will resent the data
    **/
    clear: function(){
        var self = this;
        return new Promise(function(resolve, reject){
            self._records = [];
            self.trigger('datachange');
            if (self.localdb){
                self.localdb.clear({
                    storename: self._storename,
                    projectid: self._projectid
                }).then(function(){
                        resolve(); //empty dbase from items
                });
            }
            else {
                resolve();
            }
        });
    },
    /**
        deleteAll() - sets all records to deleted=true
    **/
    deleteAll: function(){
        for (var i=0;i<this._records.length;i++){
            this._records[i].deleted(true).sync();
        }
        return this;
    },
    /**
    	pruneDeleted() - remove all deleted records from cache and dbase
    		Only makes sense when all peers are synced and/or no dbase is used 
    **/
    pruneDeleted: function(){
    	var self = this;
    	this._records.filter(function(d){
    		return d.deleted();
    	}).forEach(function(d){
    		self._removeRecord(d.id());
    		if (self.localdb){
				self.localdb.delRecord({
					storename:self._storename,
					projectid: self._projectid,
					id: d.id()
				});
			}
    	});
    },
    /**
    syncRecord() - sync 1 record, returns record
    **/
    syncRecord: function(record){
        var promise;
        var self = this;
        var message = {};
        message.syncType = this._type;
        record.dirty(false);

        if (this._projectid){ //parent store
            message.project = this._projectid;
        }
        if (this.localdb){
            promise = this.localdb.write({
                storename:this._storename,
                projectid: this._projectid,
                data: record.deflate()
            });
        }
        else { //Immediately resolve promise
            promise = new Promise(function(resolve, reject){resolve();});
        }
        promise.then(function(d){ //wait for db
            message.record = record.deflate();
            self.trigger('datachange');
            self._core.messenger().sendData(message, 'updatedRecord');
        },function(err){
            console.warn(err);
        });
        return record;
    },

    /**
    deltaList() - needed to sync the delta's
    **/
    deltaList: function(){

    },

    /**
    **/
    compareDeltas: function(){

    },

    /**
    sync() - sync the whole store, not only dirty records
    **/
    sync: function(){
        var self = this;
        self.loaded.then(function(d){
            var message = {};
            message.syncType = self._type;
            message.project = self._projectid;
            message.list = self.idList();
            self._core.messenger().sendData(message, 'newList');

        });
        self.loaded.catch(function(e){
                console.error(e.message);
                reject();
        });
    },

    /**
    idList() - needed to start the syncing with other peers
                only makes sense after fully loading the indexeddb
    **/
    idList: function(){
        var fids = [];
        for (var i=0;i<this._records.length;i++){
            var item = this._records[i];
            var iditem = {};
            iditem._id = item._id;
            iditem.timestamp = item.updated(); //TT: Deprecated, to be removed when timestamp is obsolete
            iditem.updated = item.updated();
            iditem.deleted = item.deleted();
            fids.push(iditem);
        }
        return fids;
    },
    /**
    requestItems(array) - returns the items that were requested
    **/
    requestRecords: function(fidlist){
		var pushlist = [];
		for (var i=0;i<this._records.length;i++){
		    var localrecord =  this._records[i];
		    for (j=0;j<fidlist.length;j++){
                var rem_val = fidlist[j];
                if (rem_val == localrecord._id){
                    pushlist.push(localrecord.deflate());
                }
            }
		}
		return pushlist;
	},
    /**
	compareRecords(config) - compares incoming idlist with idlist from current stack based on updated time and dirtystatus
					generates 2 lists: requestlist and pushlist
	**/
    compareRecords: function(config){
        var uid = config.uid;   //id of peer that sends syncrequest
        var fidlist = config.list;
		var returndata = {};
		var copyof_rem_list = [];
		returndata.requestlist = [];
		returndata.pushlist = [];
		var i;
		//Prepare copy of remote fids as un-ticklist, but only for non-deleted items
		if (fidlist){
			for (i=0;i<fidlist.length;i++){
				//if (fidlist[i].deleted != 'true'){
					copyof_rem_list.push(fidlist[i]._id);
				//}
			}
			for (i=0;i<this._records.length;i++){
					var local_item = this._records[i];
					var found = -1;
					for (var j=0;j<fidlist.length;j++){
							//in both lists
							var rem_val = fidlist[j];
							if (rem_val._id == local_item._id){
								found = 1;
								//TT: temporary hack to deal with deprecated timestamp
								if (!rem_val.updated){
									rem_val.updated = rem_val.timestamp;
								}
								
								//local is newer
								if (rem_val.updated < local_item._updated){
									returndata.pushlist.push(local_item.deflate());
								}
								//remote is newer
								else if (rem_val.updated > local_item._updated){
									returndata.requestlist.push(rem_val._id);
								}
								//remove from copyremotelist
								var tmppos = copyof_rem_list.indexOf(local_item._id);
								if (tmppos >= 0){
									copyof_rem_list.splice(tmppos,1);
								}
							}
					}
					//local but not remote and not deleted and not over ttl
					if (found == -1 && !local_item.deleted() && !local_item.expired()){
						returndata.pushlist.push(local_item.deflate());
					}
			}
		}
		//Add remainder of copyof_rem_list to requestlist
		for (i=0;i<copyof_rem_list.length;i++){
		    var val = copyof_rem_list[i];
			returndata.requestlist.push(val);
		}

  //This part is only for sending the data
  /* Obsolete by new websocket prototcol. Still interesting for partial syncing method though.
		var message = {};
        //First the requestlist
        message.requestlist = returndata.requestlist;
        message.pushlist = []; //empty
        //message.storename = payload.storename;
        message.dbname = this._dbname;
        //this._core.websocket().sendData(message,'syncPeer',uid);
        //Now the pushlist bit by bit
        message.requestlist = []; //empty
        var k = 0;
        for (j=0;j<returndata.pushlist.length;j++){
                var item = returndata.pushlist[j];
                message.pushlist.push(item);
                k++;
                if (k >= 1) { //max 1 feat every time
                    k = 0;
                    //this._core.websocket().sendData(message,'syncPeer',uid);
                    message.pushlist = []; //empty
                }
        }
        //sent the remainder of the list
        if (k > 0){
            //this._core.websocket().sendData(message,'syncPeer',uid);
        }
    */
   //end of sending data
        return returndata;
    }
};
//Adding some Backbone event binding functionality to the store
_.extend(Cow.syncstore.prototype, Events);
}.call(this));

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

Cow.peer = function(config){
    this._id = config._id  || Cow.utils.idgen();
    this._store = config.store;
    this._core = this._store._core;
    this._data = {
        userid:null, 
        family: 'alpha' //default is alpha
    };
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= 'true';
    this._ttl = this._store._maxAge;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};

Cow.peer.prototype = { 
        /**
            user() - return id of currently connected user
            user(id) - sets id of currently connected user, returns peer object
        **/
        user: function(id){
            if (id){
                return this.data('userid',id).sync();
            }
            if (this.data('userid')){
              var userid = this.data('userid');
              return this._core.users(userid);
            }
            return null;
        },
        username: function(){
            if (this.user()){
                return this.user().data('name');
            }
            else {
                return null;
            }
        }
            
};
_.extend(Cow.peer.prototype,Cow.record.prototype);
}.call(this));
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

Cow.socketserver = function(config){
    this._id = config._id  || Cow.utils.idgen();;
    this._store = config.store;
    this._core = this._store._core;
    this._maxAge = this._core._maxAge;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= true;
    this._ttl = this._store._maxAge;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data = {
        protocol: null,
        ip: null,
        port: null,
        dir: null
    };
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};

Cow.socketserver.prototype = { 
        url: function(){
            var protocol = this.data('protocol');
            var ip = this.data('ip');
            var port = this.data('port');
            var dir = this.data('dir') || '' ;
            return protocol + '://' + ip + ':' + port + '/' + dir;  
        }
};
_.extend(Cow.socketserver.prototype,Cow.record.prototype);
}.call(this));
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

Cow.user = function(config){
    //if (!config._id) {throw 'No _id given for user';}
    this._id = config._id  || Cow.utils.idgen();;
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= true;
    this._ttl = this._store.maxStaleness;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};
Cow.user.prototype = 
{
    /**
        isActive() - returns wether or not the user is connected to a peer at the moment
        TT: Might be obsolete, was used by core.activeUsers()
    **/
    isActive: function(){
        var returnVal = false;
        var peers = this._store._core.peers();
        for (var i = 0;i < peers.length;i++){
            if (peers[i].user() == this._id && !peers[i].deleted()){
                returnVal = true;
            }
        }
        return returnVal;
    },
    /**
        groups() - returns an array of groups that the user is member of
    **/
    groups: function(){
        var core = this._store._core;
        var returnArr = [];
        if (!core.project()){
            console.warn('No active project');
            return null;
        }
        var groups = core.project().groups();
        for (var i = 0;groups.length;i++){
            if (groups[i].hasMember(core.user().id())){
                returnArr.push(groups[i]);
            }
        }
        return returnArr;
    }
};
_.extend(Cow.user.prototype, Cow.record.prototype);
}.call(this));
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

Cow.group = function(config){
    this._id = config._id  || Cow.utils.idgen();
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= 'true';
    this._ttl = this._store.maxStaleness;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
};
Cow.group.prototype = 
{
    /**
        members() - return array of member ids
        members(id) - add id to member array, return group object
        members([id]) - add id's to member array, return group object
    **/
    members: function(userid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getMembers();
            case 1:
                if (!Array.isArray(userid)) {
                    this._addMember(userid);
                    return this;
                }
                else if (Array.isArray(userid)){
                   for (var i = 0;i<userid.length;i++){
                       var d = userid[i];
                       self._addMember(d);
                   }
                   return this;
                }
                else {
                    throw('Wrong input: ' + userid);
                }
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getMembers: function(){
        return this.data('members') || [];
    },
    _addMember: function(userid){
        var existing = false;
        var memberList = this.members();
        for (var i=0;i<memberList.length;i++){
            if (memberList[i] == userid) {
                existing = true; //Already a member
            }
        }
        if (!existing){
            memberList.push(userid); //Adding to the list
            this.data('members', memberList);
            //TODO this.core.trigger('projectListChanged', this.core.UID);
        }
        return userid;
    },
    /**
        removeMember(id) - remove id from array of member id's, return group object
    **/
    removeMember: function(userid){
        var core = this._store._core;
        var memberList = this.members();
        for (var i=0;i<memberList.length;i++){

            if (memberList[i] == userid) {
                memberList.splice(i,1); //Remove from list
                this.data('members', memberList);
                //TODO core.trigger('projectListChanged', this.core.UID);
                return this;
            }
        }
    },
    /**
        removeAllMembers() - empty 
    **/
    removeAllMembers: function(){
        var memberList = [];
        this.data('members', memberList);
        return this;
    },
    //Next can be confusing: groups can be member of another group, hence the groups item in a group
    //They are not the same in functionality, the groups is only an array of group id's
    groups: function(groupid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getGroups();
            case 1:
                if (!Array.isArray(groupid)) {
                    return this._addGroup(groupid);
                }
                else {
                   groupid.forEach(function(d){
                     var d = groupid[i];
                     self._addGroup(d);
                   });
                   return this._getGroups();
                }
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getGroups: function(){
        return this.data('groups') || [];
    },
    _addGroup: function(groupid){
        var existing = false;
        var groupList = this.groups();
        for (var i=0;i<this.groupList.length;i++){
            if (groupList[i] == groupid) {
                existing = true; //Already a member
                return groupid;
            }
        }
        if (!existing){
            groupList.push(groupid); //Adding to the list
            this.data('groups',groupList);
            //TODO self.core.trigger('projectListChanged', this.core.UID);
        }
        return groupid;
    },
    removeGroup: function(groupid){
        var groupList = this.groups();
        for (var i=0;i<this.groupList.length;i++){
            if (groupList[i] == groupid) {
                groupList.splice(i,1); //Remove from list
                self.data('groups', groupList);
                //TODO self.core.trigger('projectListChanged', this.core.UID);
                return;
            }
        }
    },
    removeAllGroups: function(){
        var groupList = [];
        this.data('groups', groupList);
        //self.core.trigger('projectListChanged', this.core.UID);
    },
    //Find out if a peer is in a group
    hasMember: function(peerid){
        //See if member is in this group
        var hasmember = false;
        var memberList = this.members();
        for (var i=0;i<memberList.length;i++){
            if (memberList[i] == peerid) {
                hasmember = true;
            }
        }
        //See if member is in other group that inherits this group
        var groupsChecked = [this._id];
        var groupList = this.groups();
        var core = this._store._core;
        var projectid = this._store._projectid;
        for (var i=0;i<groupList.length;i++){
            var groupId = groupList[i].id;
            if (groupsChecked.indexOf(groupId) < 0){// avoid looping
                groupsChecked.push(groupId);
                var group = core.projects(projectid).groups(groupId);
                hasmember = group.hasMember(peerid);
            }
        }
        return hasmember;
    }
};
_.extend(Cow.group.prototype, Cow.record.prototype);
}.call(this));
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

Cow.item = function(config){
    this._id = config._id  || Cow.utils.idgen();
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= 'true';
    this._ttl = this._store.maxStaleness;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};
Cow.item.prototype = 
{
    /**
        Function to get or set the permissions:
        permissions() will return an array with all permissions set on this item
        permissions('type') will return an array with the permission of type 'type'
        permissions('type',group) will add the group to the permissions 
            of type 'type' (and create permission of type 'type' if needed), returns item
        permissions('type',[group]) will add the array of groups to the permissions 
            of type 'type' (and create permission of type 'type' if needed), returns item
    */
    permissions: function(type,groups) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return self.data('permissions') || [];
        case 1:
            if(typeof type === "string") {
                return self._permissionsByType(type);
            }
            else {
                throw('type should be a string');
            }
            break;
        case 2: 
            if(typeof type === "string") {
                return self._setPermission(type, groups);
            }
            else {
                throw('type should be a string');
           }
           break;
        default:
            throw('wrong argument number');
        }
    
    },
    _permissionsByType: function(type) {
        var permissions = this.permissions();
        var returnval = null;
        for (var i=0;i<permissions.length;i++){
            var permission = permissions[i];
            if (permission.type == type){
                returnval = permission;
            }
        }
        return returnval;
    },
    _setPermission: function(type,groups) {
        var self = this;
        var permission = this._permissionsByType(type);
        var permissions = this.permissions();
        if (!permission) {
            //new type
            if(!Array.isArray(groups)) {
                //single group
                permission = {'type':type,'groups':[groups]};
            }
            else {
               permission = {'type':type,'groups':groups};
            }
            permissions.push(permission);
        }
        else {
            if(!Array.isArray(groups)&&!self.permissionHasGroup(type,groups)) {
                //1 group that is not in permissionlist yet
                permission.groups.push(groups);
            }
            else {
                for (var i=0;i<groups.length;i++){
                    if(!self.permissionHasGroup(type,groups[i])) {
                        permission.groups.push(groups[i]);
                    }
                }
            }
        }
        this.data('permissions', permissions);
        return this;
    },
    /**
        permissionsHasGroup(type <string>,group <string>) - function to check if a particular type contains a particular group
            returns true if it is the case, false in all other cases
    **/
    permissionHasGroup: function(type,group) {
        var permission  = this.permissions(type);
        var ingroups = [];
        if (group && Array.isArray(group)){
                ingroups = group;
        }
        else if (group){
            ingroups.push(group);
        }
        if(!permission) {
            return false;
        }
        else {
            var groups = permission.groups;
            if(groups.length === 0) {
                return false;
            }
            else {
                var doeshave = false;
                for (var i=0;i<groups.length;i++){
                    for (var j=0;j<ingroups.length;j++){
                       if (groups[i] == ingroups[j]){
                           doeshave = true;
                       }
                    }
                }
                return doeshave;
            }
        }
    },
    /**
        hasPermission(<string>) - check to see if current user has <string> permission on item
    **/
    hasPermission: function(type) {
        var core = this._store._core;
        var user = core.user().id();
        //TODO: use the new function
        var project = core.projects(this._store._projectid);
        var groups  = project.groups();
        var hasperm = false;
        var permittedgroups = this.permissions(type);
        if (permittedgroups){
            for (var i=0;i<permittedgroups.groups.length;i++){
                var value = permittedgroups.groups[i];
                if((project.groups(value) !== undefined) &&(project.groups(value).hasMember(user))) {
                    hasperm = true;
                }
            }
        }
        return hasperm;
    },
    /**
        function to remove a group from an permission type, or the entire type
        removePermission('type') removes the entire permission type from the item
        removePermission('type',[groups]) removes the groups from the permission type
    */
    removePermission: function(type,groups) {
        var index, permission, permissions, i;
        switch(arguments.length) {
        case 0:
            throw("this function doesn't take no arguments");
        case 1:
            if(typeof type === "string") {
                index = null;
                permissions = this.permissions();
                for (i=0;i<permissions.length;i++){
                    permission = permissions[i];
                    if(permission.type == type) {
                        index = i;
                    }
                }
                if(index >= 0) {
                    permissions.splice(index,1);
                }
                this.data('permissions', permissions);
                return this;
            }
            else {
                throw('type should be a string');
            }
            break;
        case 2: 
            if(typeof type === "string") {
                permissions = this.permissions();
                for (i=0;i<permissions.length;i++){
                    permission = permissions[i];
                    if(permission.type == type) {
                        index = i;
                    }
                }
                //TODO, this is prone to errors
                permission = permissions[index];
                if(permission) {
                    var pgroups = permission.groups;
                    if(pgroups.length >= 0) {
                        if(!Array.isArray(groups)) {
                            index = null;
                            for (i=0;i<pgroups.length;i++){
                                if(pgroups[i] == groups) {            
                                    index = i;
                                }            
                            }
                            if(index >= 0) {
                                pgroups.splice(index,1);
                            }
                        }
                        else {
                            for (i=0;i<groups.length;i++){                            
                                index = null;
                                for (j=0;j<pgroups.length;j++){
                                    if(pgroups[j] == groups[i]) {            
                                        index = j;
                                    }                                    
                                }
                                if(index >= 0) {
                                    pgroups.splice(index,1);
                                }
                            }
                        }
                    }
                    permission.groups = pgroups;
                    this.data('permissions',permissions);
                }
                return this;
            }
            else {
                throw('type should be a string');
            }
            break;
        default:
            throw('wrong argument number');
        }
    }
};
_.extend(Cow.item.prototype, Cow.record.prototype);

}.call(this));
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

Cow.project = function(config){
    var self = this;
    this._id = config._id  || Cow.utils.idgen();;
    this._store = config.store;
    this._core = this._store._core;
    this._maxAge = this._core._maxAge;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= 'true';
    this._ttl = this._store._maxAge;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
    var dbname = 'groups';
    this._groupStore = _.extend(
        new Cow.syncstore({dbname: dbname, noIDB: false, core: self._core, maxAge: this._maxAge}),{
        _records: [],
        _recordproto: function(_id){return new Cow.group({_id: _id, store: this});},
        _type: 'groups',
        _dbname: dbname,
        _projectid: this._id,
        dbname:  function(name){
            this._dbname =  name;
        }
    });
    
    dbname = 'items';
    this._itemStore = _.extend(
        new Cow.syncstore({dbname: dbname, noIDB: false, core: self._core, maxAge: this._maxAge}),{
        _recordproto:   function(_id){return new Cow.item({_id: _id, store: this});},
        _projectid: this._id,
        _records: [],
        _type: 'items',
        _dbname: dbname,
        /**
            dbname(string) - set name of dbase
        **/
        dbname:  function(name){
            this._dbname =  name;
        }
    });
};
Cow.project.prototype = 
{
    /**
        close(bool) - closes the project locally
            Since we don't want to sync the closed status it is written seperately to the database.
    **/
    closed: function(truefalse){
        if (truefalse !== undefined){
            this._closed = truefalse;
            var data = this.deflate();
            data.closed = this._closed;
            this._store._db_write({source: 'UI', data: data});
            return this;
        }
        else {
            return this._closed;
        }
    },
    /**
        groupStore() - return groupStore object
    **/
    groupStore: function(){
        return this._groupStore;
    },
    /**
        groups() - return array of group objects
        groups(id) - returns group with id
        groups({options}) - creates and returns group object
    **/
    groups: function(data){
           return this._groupStore.records(data);
    },
    /**
        itemStore() - return itemStore object
    **/
    itemStore: function(){
        return this._itemStore;
    },
    /**
        items() - return array of item objects
        items(id) - returns item with id
        items({options}) - creates and returns item object
    **/
    items: function(data){
        return this._itemStore.records(data);
    },
    /**
        myGroups() - return the group objects that I am member of
    **/
    myGroups: function(){
        var groups = this.groups();
        var myid = this._core.user().id();
        var mygroups = [];
        for (var i=0;i<groups.length;i++){
            var group = groups[i];
            if (group.hasMember(myid)){
                mygroups.push(group.id());
            }
        }
        return mygroups;
    }
};
_.extend(Cow.project.prototype, Cow.record.prototype);
}.call(this));
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

Cow.websocket = function(config){
    this._core = config.core;
    this._url = config.url;
    this._connection = null;
    this._connected = false;
};

    /**
        disconnect() - disconnect us from websocket server
    **/
Cow.websocket.prototype.disconnect = function() {
    if (this._connection){
        this._connection.close();    
        this._connection = null;
    }
    else { 
        console.log('No websocket active');
    }
};

    /**
        connect(url) - connect to websocket server on url, returns connection
    **/
Cow.websocket.prototype.connect = function() {
    var self = this;
    var core = this._core;
    var promise = new Promise(function(resolve, reject){
        if (core.socketserver()){
            self._url = core.socketserver().url(); //get url from list of socketservers
        }
        
        if (!self._url) {
            console.warn('Nu URL given to connect to. Make sure you give a valid socketserver id as connect(id)');
            reject();
            return false;
        }
    
        if (!self._connection || self._connection.readyState != 1 || self._connection.state != 'open') //if no connection
        {
            if(self._url.indexOf('ws') === 0) {
                var connection = null;
                connection = new WebSocket();
                connection.on('connectFailed', function(error) {
                    console.log('Connect Error: ' + error.toString());
                });
                connection.on('connect', function(conn) {
                    console.log('WebSocket client connected');
                    conn.on('error', self._onError);
                    conn.on('message', function(message) {
                        if (message.type === 'utf8') {
                            //console.log("Received: '" + message.utf8Data + "'");
                            self._onMessage({data:message.utf8Data});
                        }
                    });
                    conn.obj = self;
                    self._connection = conn;
                });
                //TODO: there is some issue with the websocket module,ssl and certificates
                //This param should be added: {rejectUnauthorized: false}
                //according to: http://stackoverflow.com/questions/18461979/node-js-error-with-ssl-unable-to-verify-leaf-signature#20408031
                connection.connect(self._url, 'connect');
            }
            else {
                console.warn('Incorrect URL: ' + self._url);
                reject();
            }
        }
        else {
            connection = self._connection;
        }
        recolve(connection);
    });
    return promise;
};
    /**
        connection() - returns connection object
    **/
Cow.websocket.prototype.connection = function(){
    return this._connection;
};

Cow.websocket.prototype.send = function(message){
    if (this._connection && (this._connection.readyState == 1 || this._connection.state == 'open')){
        this._connection.send(message);
    }
};

Cow.websocket.prototype._onMessage = function(message){
    this._core.websocket().trigger('message',message);
};

Cow.websocket.prototype._onError = function(e){
    this._core.peerStore().clear();
    this._connected = false;
    console.warn('error in websocket connection: ' + e.type);
    this._core.websocket().trigger('error');
};
Cow.websocket.prototype._onError = function(e){
    console.log('closed');
};
_.extend(Cow.websocket.prototype, Events);
}.call(this));
/*TT:
Added this from https://gist.github.com/revolunet/843889
to enable LZW encoding
*/
// LZW-compress a string
function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}
function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function decode_utf8(s) {
try{
  return decodeURIComponent(escape(s));
}
catch(e){
	console.warn(e,s);
	debugger;
}
}


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

Cow.messenger = function(config){
    this._core = config.core;
    this._numreqs = 0;
    this._amountreq = 0;
    this._sendhistory = [];
    this._amountsendhistory = [];
    this._numsends = 0;
    this._amountsend = 0;
    this._reqhistory = [];
    this._amountreqhistory = [];
    this.ws = this._core.websocket();
    this.ws.on('message',this._onMessage);
    this.ws.on('error', this._onError);
    var self = this;
    var maxloglength = 60;
    //Calculate throughput
    setInterval(function(){
        self._sendhistory.push(self._numsends);
        self._amountsendhistory.push(self._amountsend);
        if (self._sendhistory.length > maxloglength){
            self._sendhistory.shift();
            self._amountsendhistory.shift();
        }
        self._reqhistory.push(self._numreqs);
        self._amountreqhistory.push(self._amountreq);
        if (self._reqhistory.length > maxloglength){
            self._reqhistory.shift();
            self._amountreqhistory.shift();
        }
        self._numsends = 0;
        self._amountsend = 0;
        self._numreqs = 0;
        self._amountreq = 0;
    },1000);
};

/**
    activitylog() - returns activity log object
**/
Cow.messenger.prototype.activitylog = function(){
    return {
        reqhistory: this._reqhistory,
        sendhistory: this._sendhistory,
        amountreqhistory: this._amountreqhistory,
        amountsendhistory: this._amountsendhistory
    };
};

    /**
        sendData(data, action, target) - send data to websocket server with params:
            data - json object
            action - string that describes the context of the message
            target - (optional) id of the target peer
    **/
Cow.messenger.prototype.sendData = function(data, action, target){
    //TODO: check if data is an object
    var message = {};        
    message.sender = this._core.peerid();
    message.target = target;
    message.action = action;
    message.payload = lzw_encode(encode_utf8(JSON.stringify(data)));
    var stringified;
    var endcoded;
    try {
        stringified = JSON.stringify(message);
    }
    catch (e){
        console.error(e, message);
    }
    this.ws.send(stringified);
    this._numsends++;
    this._amountsend = +stringified.length;
};

Cow.messenger.prototype._onMessage = function(message){
    var core = this._core;
    var data = JSON.parse(message.data); //TODO: catch parse errors
    var sender = data.sender;
    var PEERID = core.peerid(); 
    var action = data.action;        
    if (typeof(data.payload) == 'object'){
    	data.payload = data.payload;
    }
    else {
    	data.payload = JSON.parse(decode_utf8(lzw_decode(data.payload)));
    }
    var payload = data.payload;
    var target = data.target;
    if (sender != PEERID){
        //console.info('Receiving '+JSON.stringify(data));
        this._core.messenger()._numreqs++;
        this._core.messenger()._amountreq = +message.data.length;
    }
    switch (action) {
    /**
        Commands 
    **/
        case 'command':
            if (sender != PEERID){
                this._core.messenger()._onCommand(data);
            }
        break;
    /**
        Messages related to the websocket connection
    **/
        //websocket confirms connection by returning the unique peerID (targeted)
        case 'connected':
            this._core.messenger()._onConnect(payload);
        break;
        
        //messenger tells everybody a peer has gone, with ID: peerID
        case 'peerGone':
            this._core.messenger()._onPeerGone(payload);
        break;      
    
    /**
        Messages related to the syncing protocol
    **/
        //a new peer has arrived and gives a list of its records
        case 'newList':
            if(sender != PEERID) {
                this._core.messenger()._onNewList(payload,sender);
            }
        break;
        //you just joined and you receive info from the alpha peer on how much will be synced
        case 'syncinfo':
            if(sender != PEERID) {
                this._core.messenger()._onSyncinfo(payload,sender);
            }
        break;
        //you just joined and you receive a list of records the others want (targeted)
        case 'wantedList':
            if(target == PEERID) {
                this._core.messenger()._onWantedList(payload);
            }
        break;
        
        //you just joined and receive the records (one by one)  you are missing (targeted)
        case 'missingRecord':
            if(target == PEERID) {
                this._core.messenger()._onMissingRecord(payload);
            }   
        break;
        
        //a new peer has arrived and sends everybody the records (one by one) that are requested in the *wantedList*
        case 'requestedRecord':
            if(sender != PEERID) {
                this._core.messenger()._onMissingRecord(payload);
            }
        break;
        
    /**
        Messages related to real-time changes in records
    **/
        //a peer sends a new or updated record
        case 'updatedRecord':
            if(sender != PEERID) {
                this._core.messenger()._onUpdatedRecord(payload);
            }
        break;
        
    }
    
};

/**
_onConnect handles 2 things
    1) some checks to see if the server connection is ok. (time diff and key)
    2) initiate the first sync of the stores
**/

Cow.messenger.prototype._onConnect = function(payload){
    console.log('connected!');
    this._connected = true;
    var self = this;
    this._core.peerid(payload.peerID);
    var mypeer = this._core.peers({_id: payload.peerID});
    var version = payload.server_version;
    var serverkey = payload.server_key;
    var servertime = payload.server_time;
    var now = new Date().getTime();
    var maxdiff = 1000 * 60 * 5; //5 minutes
    if (Math.abs(servertime - now) > maxdiff){
        console.warn('Time difference between server and client larger ('+Math.abs(servertime-now)+'ms) than allowed ('+maxdiff+' ms).');
        self.ws.disconnect();
        return;
    }
            
    if (serverkey !== undefined && serverkey != this._core._herdname){
        console.warn('Key on server ('+serverkey+') not the same as client key ('+this._core._herdname+').');
        self.ws.disconnect();
        return;
    }
        
    //add userid to peer object
    if (this._core.user()){
        mypeer.data('userid',this._core.user().id());
    }
    mypeer.data('version',this._core.version());
    mypeer.deleted(false).sync();
    this.trigger('connected',payload);

    //Put all load promises together
    var promisearray = [
        this._core.socketserverStore().loaded,
        this._core.peerStore().loaded,
        this._core.userStore().loaded,
        this._core.projectStore().loaded
    ];
    //Add the itemstore/groupstore load promises
    Promise.all(promisearray).then(function(){
        var projects = self._core.projects();
        var loadarray = [];
        for (var i=0;i<projects.length;i++){
            var project = projects[i];
            //Only sync items and groups in non-deleted projects
            if (!project.deleted()){
				loadarray.push([
					project.itemStore().loaded,
					project.groupStore().loaded
				]);
            }
        }
        Promise.all(loadarray).then(syncAll);
    });
    
    syncarray = [
        this._core.socketserverStore().synced,
        this._core.peerStore().synced,
        this._core.userStore().synced,
        this._core.projectStore().synced
    ];
    
    //After all idb's are loaded, start syncing process
    function syncAll(){
        console.log('Starting sync');
        self._core.projectStore().sync();
        self._core.socketserverStore().sync();
        self._core.peerStore().sync();
        self._core.userStore().sync();
        self._core.projectStore().synced.then(function(){
            var projects = self._core.projects();
            for (var i=0;i<projects.length;i++){
                var project = projects[i];
                //Only sync items and groups in non-deleted projects
                if (!project.deleted()){
					syncarray.push([project.itemStore().synced,project.groupStore().synced]); 
					project.itemStore().sync();
					project.groupStore().sync();
				}
            }
            Promise.all(syncarray).then(function(d){
                console.log('all synced');
            });
        });
    }
};
    
    
    //A peer has disconnected, remove it from your peerList
Cow.messenger.prototype._onPeerGone = function(payload) {
    var peerGone = payload.gonePeerID.toString();
    if (this._core.peers(peerGone)){
        this._core.peers(peerGone).deleted(true).sync();
    }
    this._core.peerStore().pruneDeleted();        
    //TODO this.core.trigger('ws-peerGone',payload); 
};

Cow.messenger.prototype._getStore = function(payload){
    var storetype = payload.syncType;
    var projectid = payload.project ? payload.project.toString() : null;
    var project;
    switch (storetype) {
        case 'peers':
            return this._core.peerStore();
        case 'socketservers':
            return this._core.socketserverStore();
        case 'projects':
            return this._core.projectStore();
        case 'users':
            return this._core.userStore();
        case 'items':
            if (!projectid) {
                throw('No project id given');
            }
            if (this._core.projects(projectid)){
                project = this._core.projects(projectid);
            }
            else {
                throw "No project with id "+projectid+" Indexeddb too slow with loading?";
            }
            return project.itemStore();
        case 'groups':
            if (!projectid) {
                throw('No project id given');
            }
            if (this._core.projects(projectid)){
                project = this._core.projects(projectid);
            }
            else {
                throw "No project with id "+projectid+" Indexeddb too slow with loading?";
            }
            return project.groupStore();
    }
};
    
//A peer initiates a sync
Cow.messenger.prototype._onNewList = function(payload,sender) {
    var self = this;
    //Only answer if we are the alpha peer
    if (this._amIAlpha()){
        var store = this._getStore(payload);
        var project = store._projectid;
        //Find out what should be synced
        var syncobject = store.compareRecords({uid:sender, list: payload.list});
        var data;
        //Give the peer information on what will be synced
        var syncinfo = {
            IWillSent: _.pluck(syncobject.pushlist,"_id"),
            IShallReceive: syncobject.requestlist //TODO: hey, this seems like doubling the functionality of 'wantedList'
        };
        data = {
            "syncType" : payload.syncType,
            "project" : project,
            "syncinfo" : syncinfo
        };
        this.sendData(data, 'syncinfo',sender);
        
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.requestlist
        };
        //Don't send empty lists
        if (syncobject.requestlist.length > 0){
            this.sendData(data, 'wantedList', sender);
        }
        
        syncobject.pushlist.forEach(function(d){
            msg = {
                "syncType" : payload.syncType,
                "project" : project,
                "record" : d
            };
            self.sendData(msg, 'missingRecord', sender);
        });
    }
};
Cow.messenger.prototype._amIAlpha = function(){ //find out wether I am alpha
    var returnval = null;
    var alphapeer = this._core.alphaPeer();
    var me = this._core.peer();
    if (me.id() == alphapeer.id()) {//yes, I certainly am (the oldest) 
        returnval =  true;
    }
    else { 
        returnval = false; //Not the oldest in the project
    }
    return returnval;
};

Cow.messenger.prototype._onSyncinfo = function(payload) {
    var store = this._getStore(payload);
    store.syncinfo.toReceive = payload.syncinfo.IWillSent;
    store.syncinfo.toSent = payload.syncinfo.IShallReceive;
    if (store.syncinfo.toReceive.length < 1){
    	store.trigger('synced');
    }
};

Cow.messenger.prototype._onWantedList = function(payload) {
    var self = this;
    var store = this._getStore(payload);
    var returnlist = store.requestRecords(payload.list);
    returnlist.forEach(function(d){
		msg = {
			"syncType" : payload.syncType,
			"project" : store._projectid,
			"record" : d
		};
		self.sendData(msg, 'requestedRecord');
    });
    //TODO this.core.trigger('ws-wantedList',payload); 
};
/*OBS - kept for reference    
Cow.messenger.prototype._onMissingRecords = function(payload) {
    var store = this._getStore(payload);
    var list = payload.list;
    var synclist = [];
    var i;
    
    for (i=0;i<list.length;i++){
        var data = list[i];
        var record = store._addRecord({source: 'WS', data: data});
        
        //Do the syncing for the deltas
        if (data.deltas && record.deltas()){
            var localarr = _.pluck(record.deltas(),'timestamp');
            var remotearr = _.pluck(data.deltas,'timestamp');
            var diff = _.difference(localarr, remotearr);
            //TODO: nice solution for future, when dealing more with deltas
            //For now we just respond with a forced sync our own record so the delta's get synced anyway
            if (diff.length > 0){
                synclist.push(record);
            }
        }
    }
    //After doing all the _addRecord to the store, now we should commit the queue
    store._commit();
    store.trigger('synced');
    for (i=0;i<synclist.length;i++){
        store.syncRecord(synclist[i]);
    }
    store.trigger('datachange');
    
};
*/
/* Alternative for missingRecods */
Cow.messenger.prototype._onMissingRecord = function(payload) {
    var store = this._getStore(payload);
    var synclist = [];
    var i;
	var data = payload.record;
	var record = store._addRecord({source: 'WS', data: data});
	store._commit(); //TODO: we want to do the commit after *all* missingRecords arrived
	store.trigger('datachange');
	//TODO: _.without might not be most effective way to purge an array
    store.syncinfo.toReceive = _.without(store.syncinfo.toReceive,data._id);
    //If there is no more records to be received we can trigger the synced
    if (store.syncinfo.toReceive.length < 1){
    	store.trigger('synced');
    }
	//Do the syncing for the deltas
	if (data.deltas && record.deltas()){
		var localarr = _.pluck(record.deltas(),'timestamp');
		var remotearr = _.pluck(data.deltas,'timestamp');
		var diff = _.difference(localarr, remotearr);
		//TODO: nice solution for future, when dealing more with deltas
		//For now we just respond with a forced sync our own record so the delta's get synced anyway
		if (diff.length > 0){
			store.syncRecord(record);
		}
	}
};
  
Cow.messenger.prototype._onUpdatedRecord = function(payload) {
    var store = this._getStore(payload);
    var data = payload.record;
    store._addRecord({source: 'WS', data: data});
    //After doing the _addRecord to the store, now we should commit the queue
    store._commit();
    store.trigger('datachange');
};
    // END Syncing messages
    
    
    /**
        Command messages:
            commands are ways to control peer behaviour.
            Commands can be targeted or non-targeted. Some commands are handled here (all purpose) but all commands
            will send a trigger with the command including the message data.
    **/
Cow.messenger.prototype._onCommand = function(data) {
    var core = this._core;
    var payload = data.payload;
    var command = payload.command;
    var target = payload.target;
    var params = payload.params;
    this.trigger('command',data);
    
    //Disconnects a (misbehaving or stale) peer
    if (command == 'kickPeer'){
        if (data.target == core.peerid()){
            core.socketserver('invalid');
            core.disconnect();
        }
    }
    //Remove all data from a peer
    if (command == 'purgePeer'){
        if (target && target == this._core.peerid()){
            core.projects().forEach(function(d){
                d.itemStore().clear();
                d.groupStore().clear();
            });
            core.projectStore().clear();
            core.userStore().clear();
        }
    }
    //Close project and flush the items and groups in the project (use with utter caution!) 
    if (command == 'flushProject'){
        var projectid = payload.projectid;
        var project;
        if (core.projects(projectid)){
            project = core.projects(projectid);
            project.itemStore().clear(); //remove objects from store and db
        }
    }
    //Answer a ping with a pong
    if (command == 'ping'){
        this.sendData({command: 'pong'},'command',data.sender);
    }
};

//Adding some Backbone event binding functionality to the store
_.extend(Cow.messenger.prototype, Events);
}.call(this));
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

Cow.core = function(config){
    var self = this;
    if (typeof(config) == 'undefined' ) {
        config = {};
    }
    this._version = '2.2.5';
    this._herdname = config.herdname || 'cow';
    this._userid = null;
    this._socketserverid = null;
    this._projectid = null;
    this._wsUrl = null;
    this._peerid = null;
    this._maxAge = config.maxAge || 1000 * 60 * 60 * 24 * 120; //120 days in mseconds
    this._autoReconnect = config.autoReconnect || true;
    
    /*LOCALDB*/
    this._localdb = new Cow.localdb({dbname: this._herdname, core: this});
    
    /*PROJECTS*/
    this._projectStore =  _.extend(
        new Cow.syncstore({dbname: 'projects', noIDB: false, noDeltas: false, core: self, maxAge: this._maxAge}),{
        _records: [],
        _recordproto:   function(_id){return new Cow.project({_id:_id, store: this});},
        _dbname:        'projects',
        _type:          'projects'
    });
    
    
    /*PEERS*/
    this._peerStore =  _.extend(
        new Cow.syncstore({dbname: 'peers', noIDB: true, noDeltas: true, core: this}), {
         _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.peer({_id: _id, store: this});}, 
        _dbname: 'peers',
        _type: 'peers',
        //remove peer from _peers
        removePeer:         function(id){
            return this._removeRecord(id);
        }
    });
    
    /*USERS*/
    this._userStore =  _.extend(
        new Cow.syncstore({dbname: 'users', noIDB: false, noDeltas: true, core: this}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.user({_id: _id, store: this});},     
        _dbname:        'users',
        _type:          'users'
    });
    
    /*SOCKETSERVERS*/
    this._socketserverStore =  _.extend(
        new Cow.syncstore({dbname: 'socketservers', noIDB: false, noDeltas: true, core: this}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.socketserver({_id: _id, store: this});},     
        _dbname:        'socketservers',
        _type:          'socketservers'
    });
    
    /*WEBSOCKET*/
    this._websocket = new Cow.websocket({core: this, url: this._wsUrl});
    
    /*MESSENGER*/
    this._messenger = new Cow.messenger({core:this});
    
};

Cow.core.prototype = 
{
    /**
        peerid() -- get the current peerid
        peerid(id) -- set the current peerid
    **/
    peerid: function(id){
        if (id){
            this._peerid = id.toString();
            return this._peerid;
        }
        else if (this._peerid){
            return this._peerid.toString();
        }
        return null;
    },
   
    /**
        project() -- get current project object
        project(id) -- set current project based on id from projectStore
        TODO:
        to discuss: with the current code it is not needed to have only 1 project active
            in theory the UI part can deal with that while the core can deal with multiple projects at the same time
    **/
    project: function(id){
        if (id){
            id = id.toString();
            var project = this.projects(id); 
            if (!project){
                console.warn('Trying to select a non existing project');
                return false;
            }
            this._projectid = id;
            if (this.peer()){
                this.peer().data('activeproject',id).sync();
            }
            this.trigger('projectChanged');
            return true;
        }
        else {
            if (!this._projectid) {
                return false;
            }
            return this.projects(this._projectid); 
        }
    },
    
    /**
        user() - get current user object
        user(id) - set current user based on id from userStore, return user object
    **/
    user: function(id){
        if (id){
            id = id.toString();
            this._userid = id;
            //Add user to peer object
            if (this.peer() && this.peers(this.peerid())){
                this.peer().data('userid',id).sync();
            }
            return this.users(id);
        }
        else {
            if (!this._userid) {
                return false;
            }
            return this.users(this._userid); 
        }
    },
    
    /**
        version() - get the version of cow
    **/
    version: function(){
        return this._version;
    },
    
    /**
        socketserver() - return my socketserver object
    **/
     socketserver: function(id){
        if (id){
            id = id.toString();
            this._socketserverid = id;
            return this.socketservers(id);
        }
        else {
            if (!this._socketserverid) {
                return false;
            }
            return this.socketservers(this._socketserverid);
        }
     },
    
    /**
        peer() - return my peer object
    **/
    peer: function(){
        if (this.peerid()){
            return this.peers(this.peerid());
        }
        else {
            return false;
        }
    },
    /**
        location() - get the last known location
        location(location) - set the current location
    **/
    location:   function(location){
        if (location){
            this._location = location;
            if (this.peerid()){
                this.peers(this.peerid()).data('location',location).sync();
            }
            return this._location;
        }
        else {
            return this._location;
        }
        
    },
    /**
        projectStore() - returns the _projectstore object
    **/
    projectStore:       function(){
        return this._projectStore;
    }, 
    
    /**
        projects() - returns array of all projects
        projects(id) - returns project with id (or null)
        projects({config}) - creates and returns project
    **/
    projects:       function(config){
            return this._projectStore.records(config);
    },
    /**
        peerStore() - returns the _peerstore object
    **/
    peerStore:  function(){
        return this._peerStore;
    },
    /**
        peers() - returns array of all peers
        peers(id) - returns peer with id (or null)
        peers({config}) - creates and returns peer
    **/
    peers:              function(config){
        return this._peerStore.records(config);
    },
    /**
        socketserverStore() - returns the _socketserverstore object
    **/
    socketserverStore:  function(){
        return this._socketserverStore;
    },
    /**
        socketservers() - returns array of all socketservers
        socketservers(id) - returns socketserver with id (or null)
        socketservers({config}) - creates and returns socketserver
    **/
    socketservers:      function(config){
        return this._socketserverStore.records(config);
    },
    /**
        userStore() - returns the _userstore object
    **/
    userStore:      function(){
        return this._userStore;
    }, 
    /**
        users() - returns array of all users
        users(id) - returns user with id (or null)
        users({config}) - creates and returns user
    **/
    users:       function(config){
        return this._userStore.records(config);
    }, 
    /**
        activeUsers() - returns array with userobjects that are currently active
    **/
    activeUsers: function(){
        var returnArr = [];
        var peers = this.peers().filter(function(d){return !d.deleted();});
        for (var i = 0;i<peers.length;i++){
            if (peers[i].user()){
                returnArr.push(peers[i].user());
            }
        }
        return _.uniq(returnArr); //As user can be logged in to more than one peer, only give unique users
    },
    /** 
        alphaPeer() - return the alpha peer object
    **/
    alphaPeer: function(){
        /** 
        peers all have a unique id from the server based on the timestamp
        the peer with the oldest timestamp AND member of the alpha familty is alpha
        **/
        var alphaPeers = _.sortBy(
            this.peers().filter(function(d){
                return (d.data('family') == 'alpha' && !d.deleted());
            }),
            function(d){return d.created();});
        return alphaPeers[0];
    },
    /**
        localdbase() - return the open promise of the localdbase
    **/
    dbopen: function(){
        return this._localdb._openpromise;
    },
    /**
        websocket() - return the _websocket object
    **/
    websocket: function(){
        return this._websocket;
    },
    /**
        messenger() - return the _messenger object
    **/
    messenger: function(){
        return this._messenger;
    },
    /**
        localdb() - return the _localdb object
    **/
    localdb: function(){
        return this._localdb;
    },
    /**
        connect() - starts the websocket connection, returns connection promise
    **/
    connect: function(){
        return this._websocket.connect();
    },
    /**
        disconnect() - disconnects the websocket
    **/
    disconnect: function(){
        return this._websocket.disconnect();
    }
};
//Adding some Backbone event binding functionality to the store
_.extend(Cow.core.prototype, Events);

}.call(this));

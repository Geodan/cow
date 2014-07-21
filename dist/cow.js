window.Cow = window.Cow || {};
Cow.utils = {
    //Generate a unique id
    idgen: function(){
        //TODO: add some randomness
        return new Date().getTime().toString();
    }
};

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
;window.Cow = window.Cow || {};
Cow.record = function(){
    //FIXME: 'this' object is being overwritten by its children 
    this._id    = null;
    this._status= 'dirty';
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
        var now = new Date().getTime();
        if ( _(this._deltaq).size() > 0 && !this._store.noDeltas){ //avoid empty deltas
            this.deltas(now, this._deltaq); //add deltas from queue
        }
        this._deltaq = {}; //reset deltaq
        return this._store.syncRecord(this);
    },
    
    id: function(){
        return this._id.toString();
        //You can't set an id afterwards, that only happens when object is created
    },
    created: function(){
        return this._created;
        //You can't set creation date afterwards
    },
    timestamp: function(timestamp){
        if (timestamp) {
            this._updated = timestamp;
            return this;
        }
        else {
            return this._updated;
        }
    },
    deleted: function(truefalse){
        if (truefalse !== undefined){
            this._deleted = truefalse;
            this._status = 'dirty';
            return this;
        }
        else {
            return this._deleted;
        }
    },
    status: function(status){
        if (status){
            this._status = status;
            this.timestamp(new Date().getTime());
            return this;
        }
        else {
            return this._status;
        }
    },
    /**
        Only to be used from client API
        
        data() - returns data object
        data(timestamp) - returns data object on specific time
        data(param) - returns value of data param (only 1 deep)
        data(param, value) - sets value of data param and returns record (only 1 deep)
        data(object) - sets data to object and returns record
    **/
    data: function(param, value){
        if (!param){
            if (typeof(this._data) == 'object'){
                return JSON.parse(JSON.stringify(this._data));
            }
            return this._data;
        }
        else if (param && typeof(param) == 'object' && !value){
            this._data = param;
            this.status('dirty');
            return this;
        }
        else if (param && typeof(param) == 'string' && !value){
            return this._data[param];
        }
        else if (param && typeof(param) == 'number' && !value){
            return this.data_on(param);
        }
        else if (param && value){
            if (typeof(value) == 'object'){
                value = JSON.parse(JSON.stringify(value));
            }
            this._data[param] = value;
            this._deltaq[param] = value;
            this.status('dirty');
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
            _.each(deltas, function(d){
                if (d.timestamp <= timestamp){
                    _.extend(returnval, d.data);
                }
            });
            return returnval;
        }
    },
    /**
        Deltas are written at the moment of sync, only to be used from client API
        
        deltas() - returns array of all deltas objects
        deltas(time) - returns deltas object from specific time
        deltas(time, data) - adds a new deltas objects (only done at sync)
    **/
    deltas: function(time, data){
        if (!time){
            return this._deltas;
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
                        data: data
                });
            }
            return this;
        }
        
    },
    deflate: function(){
        return {
            _id: this._id,
            status: this._status,
            created: this._created,
            deleted: this._deleted,
            updated: this._updated,
            data: this._data,
            deltas: this._deltas
        }; 
    },
    inflate: function(config){
        this._id = config._id || this._id;
        this._status = config.status || this._status;
        this._created = config.created || this._created;
        if (config.deleted !== undefined){
            this._deleted = config.deleted;
        }
        this._updated = config.updated || this._updated;
        this._data = config.data || this._data || {};
        if (!this._store.noDeltas){ //only inflate deltas when enabled
            this._deltaq = this._deltaq || {}; //FIXME: workaround for non working prototype (see top)
            this._deltasforupload = this._deltasforupload || {}; //FIXME: same here
            //deltas gets special treatment since it's an array that can be enlarged instead of overwritten
            this._deltas = this._deltas || [];
            if (config.deltas){
                for (var i = 0; i < config.deltas.length;i++){
                    var time = config.deltas[i].timestamp;
                    var data = config.deltas[i].data;
                    this.deltas(time, data);
                }
            }
        }
        return this;
    }

};
;window.Cow = window.Cow || {};
//Synstore keeps track of records
Cow.syncstore =  function(config){
    var self = this;
    this._dbname = config.dbname;
    this._core = config.core;
    this.noDeltas = config.noDeltas || false;
    this.maxStaleness = config.maxAge || null;
    this.syncinfo = {
        toReceive: [],
        toSent: [],
        received: 0, 
        send: 0
    };
    //console.log('new store',this._dbname);
    this.loaded = new Promise(function(resolve, reject){
        //console.log('reading db ',self._dbname);
        if (config.noIDB){
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
            } ).done( function ( s ) {
                self._db = s;
                self._db_getRecords().then(function(rows){
                    //console.log('Got records from db ',self._dbname);
                    rows.forEach(function(d){
                         //console.log(d);
                         var record = self._recordproto(d._id);
                         record.inflate(d);
                         var lastupdate = record.timestamp();
                         var now = new Date().getTime();
                         var staleness = now - lastupdate;
                         var existing = false; 
                         //Not likely to exist in the _records at this time but better safe then sorry..
                         for (var i=0;i<self._records.length;i++){
                            if (self._records[i]._id == record._id) {
                                //existing = true; //Already in list
                                //record = -1;
                            }
                         }//Object should be non existing yet and not older than some max setting
                         if (!existing && (staleness < self.maxStaleness || self.maxStaleness === null)){
                             self._records.push(record); //Adding to the list
                         }
                     });
                     self.trigger('datachange');
                     resolve();
                }).catch(function(e){
                    console.warn(e.message);
                });
            });
        }
    });
}; 
/**
    See for use of promises: 
        1. http://www.html5rocks.com/en/tutorials/es6/promises/
        2. https://github.com/jakearchibald/ES6-Promises
**/

Cow.syncstore.prototype =  
{ //db object
    //All these calls will be asynchronous and thus returning a promise instead of data
   
    //_db_addRecord: function(config){
    _db_write: function(config){
        var data = config.data;
        var source = config.source;
        data._id = data._id.toString();
        var self = this;
        var db = this._db;
        return new Promise(function(resolve, reject){
            db.main.remove(data._id).done(function(){
                db.main.add(data).done(function(d){
                    resolve(d);
                }).fail(function(d,e){
                    //console.warn(e.srcElement.error.message);
                    reject(e);
                });
            }).fail(function(e){
                console.warn(e);
                reject(e);
            });
        });
    },
    _db_getRecords: function(){
        var self = this;
        return new Promise(function(resolve, reject){
           self._db.main.query().filter().execute().done(function(doc){
                resolve(doc);
           }).fail(function(e){
                reject(e);
           });
        });
    },  //returns promise
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
      /** NOT USED AT THE MOMENT, replaced by function in creating syncstore **/
      /*
    _initRecords: function(){ //This will start the process of getting records from db (returns promise)
        var promise = this._db_getRecords();
        var self = this;
        promise.then(function(r){
             
             r.forEach(function(d){
                 //console.log(d.doc);
                 var record = self._recordproto(d._id);
                 record.inflate(d);
                 var existing = false; //Not likely to exist in the _records at this time but better safe then sorry..
                 for (var i=0;i<self._records.length;i++){
                    if (self._records[i]._id == record._id) {
                        existing = true; //Already in list
                        record = -1;
                    }
                 }
                 if (!existing){
                     self._records.push(record); //Adding to the list
                 }
             });
             self.trigger('datachange');
        });
        return promise;
     },
     */
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
        //return this._addRecord({source: 'UI', data: config}).status('dirty');
        //TODO: rethink this strategy: should we make a new record on non-existing or just return null
        return null;
    },
    /**
    _addRecord - creates a new record and replaces an existing one with the same _id
        when the source is 'WS' it immidiately sends to the _db, if not the record needs a manual record.sync()
    **/
    _addRecord: function(config){
        if (!config.source || !config.data){
            console.warn('Wrong input: ',config);
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
                record.deleted(false); //set undeleted
                if (this._db && source == 'WS'){ //update the db
                    //promise = this._db_updateRecord({source:source, data: record.deflate()});
                    this._db_write({source:source, data: record.deflate()});
                }
            }
        }
        if (!existing){
            //Create a new record and inflate with the data we got
            record = this._recordproto(data._id);
            record.inflate(data);
            if (this._db && source == 'WS'){
                promise = this._db_write({source:source,data:record.deflate()});
            }
            this._records.push(record); //Adding to the list
            //console.log(this._records.length); 
        }
        
        return record;
    },
    /**
        _getRecordsOn(timestamp) - 
    **/
    _getRecordsOn: function(timestamp){
        var returnarr = [];
        _.each(this._records, function(d){
            //If request is older than feature itself, disregard
            if (timestamp < d._created){
                //don't add
            }
            //If request is younger than last feature update, return normal data
            else if (timestamp > d._updated){
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
            return this._addRecord({source: 'UI', data: config}).status('dirty');
        }
        else if (config && typeof(config) == 'string'){
            return this._getRecord(config);
        }
        else if (config && typeof(config) == 'number'){
            //TODO return this._getRecordsOn(config);
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
                    this.trigger('datachange');
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
            if (self._db){
                self._db.main.clear().then(function(){
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
            this._records[i].deleted(true);
        }
        this.syncRecords();
        this.trigger('datachange');
        return this;
    },
    /**
    syncRecord() - sync 1 record, returns record
    **/
    syncRecord: function(record){
        
        var self = this;
        var message = {};
        message.syncType = this._type;
        record.status('clean');
        
        if (this._projectid){ //parent store
            message.project = this._projectid;
        }
        if (this._db){
            //var promise = this._db_updateRecord({source:'UI', data: record.deflate()});
            var promise = this._db_write({source:'UI', data: record.deflate()});
            promise.then(function(d){ //wait for db
                message.record = record.deflate();
                self.trigger('datachange');
                self._core.websocket().sendData(message, 'updatedRecord');
            },function(err){
                //console.warn(err);
            });
        } else { //No db, proceed immediately
            message.record = record.deflate();
            self.trigger('datachange');
            self._core.websocket().sendData(message, 'updatedRecord');
        }//TODO: remove this double code, but keep promise/non-promise intact
        return record;
    },
    
    /**
    syncRecords() - looks for dirty records and returns them all at once for syncing them
    **/
    syncRecords: function(){
        var pushlist = [];
        for (var i=0;i<this._records.length;i++){
            var record = this._records[i];
            if (record._status == 'dirty') {
                //this.syncRecord(record);
                record.status('clean');
                pushlist.push(record.deflate());
            }
        }
        var data =  {
            "syncType" : this._type,
            "project" : this._projectid,
            "list" : pushlist
        };
        this._core.websocket().sendData(data, 'requestedRecords');
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
        this.loaded.then(function(d){
            var message = {};
            message.syncType = self._type;
            message.project = self._projectid;
            message.list = self.idList();
            self._core.websocket().sendData(message, 'newList');
        });
        self.loaded.catch(function(e){
                console.error(e.message);
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
            iditem.timestamp = item.timestamp();
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
	compareRecords(config) - compares incoming idlist with idlist from current stack based on timestamp and status
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
				if (fidlist[i].deleted != 'true'){
					copyof_rem_list.push(fidlist[i]._id);
				}
			}
			for (i=0;i<this._records.length;i++){
					var local_item = this._records[i];
					var found = -1;
					for (var j=0;j<fidlist.length;j++){
							//in both lists
							var rem_val = fidlist[j];
							if (rem_val._id == local_item._id){
								found = 1;
								//local is newer
								if (rem_val.timestamp < local_item._updated){
									returndata.pushlist.push(local_item.deflate());
								}
								//remote is newer
								else if (rem_val.timestamp > local_item._updated){
									returndata.requestlist.push(rem_val._id);
								}
								//remove from copyremotelist
								//OBS var tmppos = $.inArray(local_item._id,copyof_rem_list);
								var tmppos = copyof_rem_list.indexOf(local_item._id);
								if (tmppos >= 0){
									copyof_rem_list.splice(tmppos,1);
								}
							}
					}
					//local but not remote and not deleted
					if (found == -1 && local_item.deleted() != 'true'){
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
;window.Cow = window.Cow || {};
Cow.peer = function(config){
     if (!config._id) {throw 'No _id given for peer';}
    this._id = config._id;
    this._store = config.store;
    this._core = this._store._core;
    this._data = {
        userid:null, 
        family: 'alpha' //default is alpha
    };
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
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
        //user: function(id){
        //    if (id) {
        //        return this.data('userid',id);
        //    }
        //    return this.data('userid');
        //},
        user: function(id){
            if (id){
                return this.data('userid',id).sync();
            }
            if (this.data('userid')){
              var userid = this.data('userid');
              return this._core.users(userid);
            }
            console.warn('No user connected to this peer');
            return null;
        },
        username: function(){
            if (this.user()){
                return this.user().data('name');
            }
            else {
                return 'Anon';
            }
        }
            
};
_.extend(Cow.peer.prototype,Cow.record.prototype);
;window.Cow = window.Cow || {};
Cow.socketserver = function(config){
     if (!config._id) {throw 'No _id given for socketserver';}
    this._id = config._id;
    this._store = config.store;
    this._core = this._store._core;
    this._data = {
        protocol: null,
        ip: null,
        port: null,
        dir: null
    };
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
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
;window.Cow = window.Cow || {};
Cow.user = function(config){
    if (!config._id) {throw 'No _id given for user';}
    this._id = config._id;
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
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
    name: function(name){
        if (name){
            return this.data('name', name);
        }
        return this.data('name');
    },
    mail: function(mail){
        if (mail){
            return this.data('mail', mail);
        }
        return this.data('mail');
    },
    /**
        isActive() - returns wether or not the user is connected to a peer at the moment
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
    },
    /** 
        activeprojects() - returns array of active projects
        activeprojects(id) - adds project to array of active projects
        activeprojects(id,true) - removes project from array of active projects
    **/
    activeprojects: function(projectid, deleteme){
        var projectarr = this.data('activeprojects') || [];
        if (projectid && deleteme){
            var idx = projectarr.indexOf(projectid);
            projectarr.splice(idx,1);
            return this.data('activeprojects',projectarr);
        }
        if (projectid){
            projectarr.push(projectid);
            return this.data('activeprojects',projectarr);
        }
        return this.data('activeprojects') || [];
    },
    /** 
        mutedprojects() - returns array of muted projects
        mutedprojects(id) - adds project to array of muted projects
        mutedprojects(id,true) - removes project from array of muted projects
    **/
    mutedprojects: function(projectid, deleteme){
        var projectarr = this.data('mutedprojects') || [];
        if (projectid && deleteme){
            var idx = projectarr.indexOf(projectid);
            projectarr.splice(idx,1);
            return this.data('mutedprojects',projectarr);
        }
        if (projectid){
            projectarr.push(projectid);
            return this.data('mutedprojects',projectarr);
        }
        return this.data('mutedprojects') || [];
    }
    
};
_.extend(Cow.user.prototype, Cow.record.prototype);
;window.Cow = window.Cow || {};
Cow.group = function(config){
    if (!config._id) {throw 'No _id given for group';}
    this._id = config._id;
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
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
                   //return this._getMembers();
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
                   for (var i=0;i<groupid.length;i++){
                   //$.each(groupid, function(i,d){
                     var d = groupid[i];
                     self._addGroup(d);
                   }
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
            //if (this.memberList[i].id == peerid && this.memberList[i].status != 'deleted') {
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
;window.Cow = window.Cow || {};
Cow.item = function(config){
    if (!config || !config._id) {throw 'No _id given for item';}
    this._id = config._id;
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
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
                //$.each(groups,function(i){
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
                //$.each(groups,function(i){
                    for (var j=0;j<ingroups.length;j++){
                    //$.each(ingroups, function(j){
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
            //$.each(permittedgroups[0].groups, function(key,value) {
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
                //self._timestamp = new Date().getTime();
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
;window.Cow = window.Cow || {};
Cow.project = function(config){
    var self = this;
    if (!config._id) {throw 'No _id given for project';}
    this._id = config._id;
    this._store = config.store;
    this._core = this._store._core;
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
    var dbname = 'groups_' + config._id;
    this._groupStore = _.extend(
        new Cow.syncstore({dbname: dbname, core: self._core}),{
        _records: [],
        _recordproto: function(_id){return new Cow.group({_id: _id, store: this});},
        _type: 'groups',
        _dbname: dbname,
        _projectid: this._id,
        dbname:  function(name){
            this._dbname =  name;
        }
    });
    
    dbname = 'items_' + config._id;
    this._itemStore = _.extend(
        new Cow.syncstore({dbname: dbname, core: self._core}),{
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
;window.Cow = window.Cow || {};

Cow.websocket = function(config){
    this._core = config.core;
    //socket connection object
    this._url = config.url;
    this._connection = null; //obs this.connect();
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
Cow.websocket.prototype.connect = function(id) {
    var core = this._core;
    this._url = core.socketservers(id).url(); //get url from list of socketservers
    core._socketserverid = id;
    if (!this._url) {throw('Nu URL given to connect to. Make sure you give a valid socketserver id as connect(id)');}
    if (!this._connection || this._connection.readyState != 1) //if no connection
    {
        if(this._url.indexOf('ws') === 0) {
            var connection = new WebSocket(this._url, 'connect');
            connection.onopen = this._onOpen;
            connection.onmessage = this._onMessage;
            connection.onclose = this._onClose;    
            connection.onerror = this._onError;
            connection.obj = this;
            this._connection = connection;
        }
        else {throw('Incorrect URL: ' + this._url);}
    }
    else {
        connection = this._connection;
    }
    return connection;
};
    /**
        connection() - returns connection object
    **/
Cow.websocket.prototype.connection = function(){
    return this._connection;
};    
    /**
        sendData(data, action, target) - send data to websocket server with params:
            data - json object
            action - string that describes the context of the message
            target - (optional) id of the target peer
    **/
Cow.websocket.prototype.sendData = function(data, action, target){
    //TODO: check if data is an object
    var message = {};        
    message.sender = this._core.peerid();
    message.target = target;
    message.action = action;
    message.payload = data;
    var stringified;
    try {
        stringified = JSON.stringify(message);
    }
    catch (e){
        console.error(e, message);
    }
    if (this._connection && this._connection.readyState == 1){
        //console.log('Sending ',message);
        this._connection.send(JSON.stringify(message));
    }
    else{
        //console.warn('Could not send, socket not connected?');
    }
};
Cow.websocket.prototype._onMessage = function(message){
    var core = this.obj._core;
    var data = JSON.parse(message.data); //TODO: catch parse errors
    var sender = data.sender;
    var PEERID = core.peerid(); 
    var action = data.action;        
    var payload = data.payload;    
    var target = data.target;
    if (sender != PEERID){
        //console.log('Receiving ',data);
    }
    switch (action) {
    /**
        Commands 
    **/
        case 'command':
            if (sender != PEERID){
                this.obj._onCommand(data);
            }
        break;
    /**
        Messages related to the websocket connection
    **/
        //websocket confirms connection by returning the unique peerID (targeted)
        case 'connected':
            this.obj._onConnect(payload);
        break;
        
        //websocket tells everybody a peer has gone, with ID: peerID
        case 'peerGone':
            this.obj._onPeerGone(payload);
        break;      
    
    /**
        Messages related to the syncing protocol
    **/
        //a new peer has arrived and gives a list of its records
        case 'newList':
            if(sender != PEERID) {
                this.obj._onNewList(payload,sender);
            }
        break;
        //you just joined and you receive info from the alpha peer on how much will be synced
        case 'syncinfo':
            if(sender != PEERID) {
                this.obj._onSyncinfo(payload,sender);
            }
        break;
        //you just joined and you receive a list of records the others want (targeted)
        case 'wantedList':
            if(target == PEERID) {
                this.obj._onWantedList(payload);
            }
        break;
        
        //you just joined and receive the records you are missing (targeted)
        case 'missingRecords':
            if(target == PEERID) {
                this.obj._onMissingRecords(payload);
            }   
        break;
        
        //a new peer has arrived and sends everybody the records that are requested in the *wantedList*
        case 'requestedRecords':
            if(sender != PEERID) {
                this.obj._onMissingRecords(payload);
                //OBS: this.obj._onRequestedRecords(payload);
            }
        break;
    /**
        Messages related to real-time changes in records
    **/
        //a peer sends a new or updated record
        case 'updatedRecord':
            if(sender != PEERID) {
                this.obj._onUpdatedRecords(payload);
            }
        break;
        
    }
    
};
Cow.websocket.prototype._onClose = function(event){
    var code = event.code;
    var reason = event.reason;
    var wasClean = event.wasClean;
    var self = this;
    //this.close(); //FIME: TT: why was this needed?
    this.obj._core.peerStore().clear();
    //TODO this.obj._core.trigger('ws-disconnected');    
    var restart = function(){
        try{
            self.obj._core.websocket().disconnect();
        }
        catch(err){
            console.warn(err);
        }
        var url = self.obj._url;
        self.obj._connection = self.obj._core.websocket().connect(url);
    };
    //setTimeout(restart,5000);
};
Cow.websocket.prototype._onConnect = function(payload){
    var self = this;
    this._core.peerid(payload.peerID);
    var mypeer = this._core.peers({_id: payload.peerID});
    var version = payload.server_version;
    var serverkey = payload.server_key;
    
    if (serverkey != 'test'){ //TODO: key must become variable
        self.disconnect();
        return;
    }
        
    //add userid to peer object
    if (this._core.user()){
        mypeer.data('userid',this._core.user()._id);
    }
    mypeer.deleted(false).sync();
    this.trigger('connected',payload);
    
    //initiate socketserver sync
    this._core.socketserverStore().sync();
    
    //initiate peer sync
    this._core.peerStore().sync();

    //initiate user sync
    this._core.userStore().sync();
    
    //initiate project sync
    var projectstore = this._core.projectStore();
    projectstore.sync();
    
    //wait for projectstore to load
    projectstore.loaded.then(function(d){
        var projects = self._core.projects();
        for (var i=0;i<projects.length;i++){
            var project = projects[i];
            self._core.projects(project._id).itemStore().sync();
            self._core.projects(project._id).groupStore().sync();
        }
    });
};
    
    
    //A peer has disconnected, remove it from your peerList
Cow.websocket.prototype._onPeerGone = function(payload) {
    var peerGone = payload.gonePeerID.toString();
    if (this._core.peers(peerGone)){
        this._core.peers(peerGone).deleted(true).sync();
    }
    //this._core.peerStore().removePeer(peerGone);        
    //TODO this.core.trigger('ws-peerGone',payload); 
};
Cow.websocket.prototype._onError = function(e){
    console.warn('error in websocket connection: ' + e.type);
};
Cow.websocket.prototype._getStore = function(payload){
    var storetype = payload.syncType;
    var projectid = payload.project;
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
            if (!projectid) {throw('No project id given');}
            if (this._core.projects(projectid)){
                project = this._core.projects(projectid);
            }
            else {
                project = this._core.projects({_id:projectid});
            }
            return project.itemStore();
        case 'groups':
            if (!projectid) {throw('No project id given');}
            if (this._core.projects(projectid)){
                project = this._core.projects(projectid);
            }
            else {
                project = this._core.projects({_id:projectid});
            }
            return project.groupStore();
    }
};
    
//A peer initiates a sync
Cow.websocket.prototype._onNewList = function(payload,sender) {
    var self = this;
    //Only answer if we are the alpha peer
    if (this._amIAlpha()){
        var store = this._getStore(payload);
        var project = store._projectid;
        var syncobject = store.compareRecords({uid:sender, list: payload.list});
        var data;
        //Give the peer information on what will be synced
        var syncinfo = {
            IWillSent: _.pluck(syncobject.pushlist,"_id"),
            IShallReceive: _.pluck(syncobject.requestlist,"_id") 
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
        this.sendData(data, 'wantedList', sender);
        
        data =  {
            "syncType" : payload.syncType,
            "project" : project,
            "list" : syncobject.pushlist
        };
        /** TT: IIS/signalR can't handle large chunks in websocket.
        Therefore we sent the records one by one. This slows down the total but should be 
        more stable **/
        _(data.list).each(function(d){
            msg = {
                "syncType" : payload.syncType,
                "project" : project,
                "record" : d
            };
            self.sendData(msg, 'updatedRecord', sender);
        });
        //this.sendData(data, 'missingRecords', sender);
    }
};
Cow.websocket.prototype._amIAlpha = function(){ //find out wether I am alpha
    /** 
    peers all have a unique id from the server based on the timestamp
    the peer with the oldest timestamp AND member of the alpha familty is alpha
    **/
    var returnval = null;
    //First only get alpha peers
    var alphaPeers = _.sortBy(
        _.filter(this._core.peers(),function(d){
            return (d.data('family') == 'alpha' && !d.deleted());
        }),
     function(d){return d.created();});
    //If we are the oldest of alpha peers
    var oldestpeer = alphaPeers[0];
    var me = this._core.peer();
    if (me.created() == oldestpeer.created()) {//yes, I certainly am (the oldest) 
        returnval =  true;
    }
    else { 
        returnval = false; //Not the oldest in the project
    }
    return returnval;
};

Cow.websocket.prototype._onSyncinfo = function(payload) {
    var store = this._getStore(payload);
    store.syncinfo.toReceive = payload.syncinfo.IWillSent;
    store.syncinfo.toSent = payload.syncinfo.IShallReceive;
};

Cow.websocket.prototype._onWantedList = function(payload) {
    var self = this;
    var store = this._getStore(payload);
    var returnlist = store.requestRecords(payload.list);
    var data =  {
        "syncType" : payload.syncType,
        "project" : store._projectid,
        "list" : returnlist
    };
    /** TT: IIS/signalR can't handle large chunks in websocket.
        Therefore we sent the records one by one. This slows down the total but should be 
        more stable **/
    _(data.list).each(function(d){
        msg = {
            "syncType" : payload.syncType,
            "project" : store._projectid,
            "record" : d
        };
        self.sendData(msg, 'updatedRecord');
    });
    //this.sendData(data, 'requestedRecords');
    //TODO this.core.trigger('ws-wantedList',payload); 
};
    
Cow.websocket.prototype._onMissingRecords = function(payload) {
    var store = this._getStore(payload);
    var list = payload.list;
    var synclist = [];
    var i;
    for (i=0;i<list.length;i++){
        var data = list[i];
        //var record = store._addRecord({source: 'WS', data: data});
        var record = store._addRecord({source: 'WS', data: data});
        //if we receive a new project, we also have to get the items and groups in it
        if (store._type == 'projects'){
            record.groupStore().sync();
            record.itemStore().sync();
        }
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
    for (i=0;i<synclist.length;i++){
        store.syncRecord(synclist[i]);
    }
    store.trigger('datachange');
};
  
Cow.websocket.prototype._onUpdatedRecords = function(payload) {
    var store = this._getStore(payload);
    var data = payload.record;
    store._addRecord({source: 'WS', data: data});
    //TODO: _.without might not be most effective way to purge an array
    store.syncinfo.toReceive = _.without(store.syncinfo.toReceive,data._id); 
    store.trigger('datachange');
};
    // END Syncing messages
    
    
    /**
        Command messages:
            commands are ways to control peer behaviour.
            Commands can be targeted or non-targeted. Some commands are handled here (all purpose) but all commands
            will send a trigger with the command including the message data.
    **/
Cow.websocket.prototype._onCommand = function(data) {
    var core = this._core;
    var payload = data.payload;
    var command = payload.command;
    var targetuser = payload.targetuser;
    var params = payload.params;
    this.trigger('command',data);
    //TODO: move to icm
    if (command == 'zoomTo'){
        if (targetuser && targetuser == core.user().id()){
            this.trigger(command, payload.location);
        }
    }
    //Closes a (misbehaving or stale) peer
    if (command == 'kickPeer'){
        if (targetuser && targetuser == core.peerid()){
            //TODO: make this more gentle, possibly with a trigger
            window.open('', '_self', ''); 
            window.close();
        }
    }
    //Remove all data from a peer
    if (command == 'purgePeer'){
        if (targetuser && targetuser == this._core.peerid()){
            _.each(core.projects(), function(d){
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
            project.itemStore().clear(); //remove objects from store
            project.itemStore()._db.main.clear(); //remove records from db
        }
    }
    //Answer a ping with a pong
    if (command == 'ping'){
        var target = data.sender;
        this.sendData({command: 'pong'},'command',target);
    }
};

//Adding some Backbone event binding functionality to the store
_.extend(Cow.websocket.prototype, Events);
;Cow.core = function(config){
    var self = this;
    //if (!config.wsUrl){throw('No wsURL given');}
    this._userid = null;
    this._socketserverid = null;
    this._projectid = null;
    this._wsUrl = null;
    this._peerid = null;
    this._maxAge = 1000 * 60 * 60 * 24 * 30; //30 days in mseconds
    /*WEBSOCKET*/
    this._websocket = new Cow.websocket({url: this._wsUrl, core: this});
    
    /*PROJECTS*/
    this._projectStore =  _.extend(
        new Cow.syncstore({dbname: 'projects', noDeltas: true, core: self}),{
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
        new Cow.syncstore({dbname: 'users', noDeltas: true, core: this}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.user({_id: _id, store: this});},     
        _dbname:        'users',
        _type:          'users'
    });
    
    /*SOCKETSERVERS*/
    this._socketserverStore =  _.extend(
        new Cow.syncstore({dbname: 'socketservers', noDeltas: true, core: this, maxAge: this.maxAge}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.socketserver({_id: _id, store: this});},     
        _dbname:        'socketservers',
        _type:          'socketservers'
    });
    
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
        user(id) - set current user based on id from userStore
    **/
    user: function(id){
        if (id){
            id = id.toString();
            this._userid = id;
            //Add user to peer object
            if (this.peerid()){
                //TODO: separate name and id 
                this.peers(this.peerid()).data('userid',id).sync();
            }
            return this.users(id).data('name', id);
        }
        else {
            if (!this._userid) {
                return false;
            }
            return this.users(this._userid); 
        }
    },
    /**
        socketserver() - return my socketserver object
    **/
     socketserver: function(){
        if (!this._socketserverid) {
            return false;
        }
        return this.socketservers(this._socketserverid); 
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
        var users = this.users();
        for (var i = 0;i<users.length;i++){
            if (users[i].isActive()){
                returnArr.push(users[i]);
            }
        }
        return returnArr;
    },
    /**
        websocket() - return the _websocket object
    **/
    websocket: function(){
        return this._websocket;
    },
    /**
        connect(id) - starts the websocket connection, returns connection
    **/
    connect: function(id){
        return this._websocket.connect(id);
    }
};
//Adding some Backbone event binding functionality to the store
_.extend(Cow.core.prototype, Events);
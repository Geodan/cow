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

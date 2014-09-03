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
    this._id    = null;
    this._status= 'dirty'; //deprecated, replaced by _dirty
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
        console.warn('timestamp() has been deprecated. Use updated() instead');
        if (timestamp) {
            this._updated = timestamp;
            return this;
        }
        else {
            return this._updated;
        }
    },
    updated: function(timestamp){
        if (timestamp) {
            this._updated = timestamp;
            return this;
        }
        else {
            return this._updated;
        }
    },
    touch: function(){
        this.updated(new Date().getTime());
    },
    deleted: function(truefalse){
        if (truefalse !== undefined){
            this._deleted = truefalse;
            this.updated(new Date().getTime()); //TT: added this because otherwhise deleted objects do not sync
            this._dirty = true;
            return this;
        }
        else {
            return this._deleted;
        }
    },
    dirty: function(truefalse){
        if (truefalse !== undefined){
            this._dirty = truefalse;
            
            if (this._dirty) this._status = 'dirty'; //to be removed when status becomes deprecated
            else this._status = 'clean';
            
            return this;
        }
        else {
            return this._dirty;
        }
    },
    status: function(status){
        if (status){
            this._status = status;
            
            if (this._status == 'dirty') this._dirty = true;
            else this._dirty = false;
            
            this.updated(new Date().getTime());
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
            this.dirty(true);
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
            this.dirty(true);
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
                        //TODO: Issue: #125
                        //it would be nice if we also save the userid of the user that syncs this 
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
            status: this._status,
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
        this._id = config._id || this._id || new Date().getTime().toString();
        this._status = config.status || this._status; //to be deprecated
        if (config.dirty !== undefined){
            this._dirty = config.dirty;
        }
        else { //remove this when status is deprecated
            if (this._status == 'clean') this._dirty = false;
            else this._dirty = true;
        }
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
}.call(this));
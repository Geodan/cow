window.Cow = window.Cow || {};
Cow.record = function(){
    //FIXME: 'this' object is being overwritten by its children 
    this._id    = null;
    this._status= 'dirty';
    this._deleted= 'false';
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
        this.deltas(now, this._deltaq); //add deltas from queue
        this._deltaq = {}; //reset deltaq
        return this._store.syncRecord(this);
    },
    
    id: function(){
        return this._id;
        //You can't set an id afterwards, that only happens when object is created
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
        if (truefalse != null){ //TODO, this is not the recommended way, but !== gives always true
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
            return this._data;
        }
        else if (param && typeof(param) == 'object'){
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
        this._deltaq = this._deltaq || {}; //FIXME: workaround for non working prototype (see top)
        this._deltasforupload = this._deltasforupload || {}; //FIXME: same here
        this._id = config._id || this._id;
        this._status = config.status || this._status;
        this._created = config.created || this._created;
        this._deleted = config.deleted || this._deleted;
        this._updated = config.updated || this._updated;
        this._data = config.data || this._data || {};
        //deltas gets special treatment since it's an array that can be enlarged instead of overwritten
        this._deltas = this._deltas || [];
        if (config.deltas){
            for (var i = 0; i < config.deltas.length;i++){
                var time = config.deltas[i].timestamp;
                var data = config.deltas[i].data;
                this.deltas(time, data);
            }
        }
        return this;
    }

};

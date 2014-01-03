window.Cow = window.Cow || {};
Cow.record = function(){
    this._id    = null;
    this._rev   = null;
    this._status= 'dirty';
    this._deleted= 'false';
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
};
Cow.record.prototype = 
{
    sync: function(){
        this._store.syncRecords(this);
        return this;
    },
    
    id: function(){
        return this._id;
        //No setting id, that only happens when object is created
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
        else if (param && !value){
            return this._data[param];
        }
        else if (param && value){
            this._data[param] = value;
            this.status('dirty');
            return this; 
        }
    },
    deflate: function(){
        return {
            _id: this._id,
            _rev: this._rev,
            status: this._status,
            created: this._created,
            deleted: this._deleted,
            updated: this._updated,
            data: this._data
        }; 
    },
    inflate: function(config){
        this._id = config._id || this._id;
        this._rev = config._rev || this._rev;
        this._status = config.status || this._status;
        this._created = config.created || this._created;
        this._deleted = config.deleted || this._deleted;
        this._updated = config.updated || this._updated;
        this._data = config.data || this._data || {};
        return this;
    }

};

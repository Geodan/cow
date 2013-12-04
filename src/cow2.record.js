window.Cow = window.Cow || {};
Cow.record = function(){};
Cow.record.prototype = 
{
    _id: null,
    _rev: null,
    _status: 'active',
    _created: null,
    _updated: null,
    _data: {},
    timestamp: function(timestamp){
        this._updated = timestamp || this._updated;
        return this._updated;
    },
    status: function(){
        return this._status;
    },
    getStatus: function(){
        return this._status;
    },
    setStatus: function(status){
        this._status = status;
        this._updated = new Date().getTime();
        return this._status;
    },
    data: function(param, value){
        if (!param){
            return this._data;
        }
        else if (param && !value){
            return this._data[param];
        }
        else if (param && value){
            this._updated = new Date().getTime();
            this._data[param] = value;
            return this._data; 
        }
    },
    deflate: function(){
        return {
            _id: this._id,
            _rev: this._rev,
            status: this._status,
            created: this._created,
            updated: this._updated,
            data: this._data
        }; 
    },
    inflate: function(config){
        this._id = config._id || this._id;
        this._rev = config._rev || this._rev;
        this._status = config.status || this._status;
        this._created = config.created || this._created;
        this._updated = config.updated || this._updated;
        this._data = config.data || this._data || {};
        return this;
    }

};

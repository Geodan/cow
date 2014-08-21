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
    this._groupStore = __.extend(
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
    this._itemStore = __.extend(
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
__.extend(Cow.project.prototype, Cow.record.prototype);
}.call(this));
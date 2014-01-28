window.Cow = window.Cow || {};
Cow.project = function(config){
    var self = this;
    if (!config._id) {throw 'No _id given for project';}
    this._id = config._id;
    this._store = config.store;
    this._core = this._store._core;
    
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
    __proto__: Cow.record.prototype,
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
        for (i=0;i<groups.length;i++){
            var group = groups[i];
            if (group.hasMember(myid)){
                mygroups.push(group.id());
            }
        }
        return mygroups;
    }
};

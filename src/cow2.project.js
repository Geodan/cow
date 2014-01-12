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
        },
        /**
            features() - get only items with type==feature
        **/
        features: function(){
            var items = this._records;
            var returnarr = [];
            for (var i = 0;i<items.length;i++){
                if (items[i].data('type') == 'feature'){
                    returnarr.push(items[i]);
                }
            }
            return returnarr;
        },
        /**
            messages() - get only items with type==msg
        **/
        messages: function(){
            var items = this._records;
            var returnarr = [];
            for (var i = 0;i<items.length;i++){
                if (items[i].data('type') == 'msg'){
                    returnarr.push(items[i]);
                }
            }
            return returnarr;
        }
    });
};
Cow.project.prototype = 
{
    __proto__: Cow.record.prototype,
 
    groupStore: function(){
        return this._groupStore;
    },
    groups: function(data){
           return this._groupStore.records(data);
    },
 
    itemStore: function(){
        return this._itemStore;
    },
    items: function(data){
        return this._itemStore.records(data);
    },
    
    getMembers: function(){
        return this.data('members') || [];
    },
    addMember: function(id){
        var existing = false;
        var curmembers = this.getMembers();
        for (var i=0;i<curmembers.length;i++){
            if (curmembers[i] == id) {
                existing = true; //Already a member
                return false;
            }
        }
        if (!existing){
            curmembers.push(id); //Adding to the list
            this.data('members', curmembers);
        }
        return id;
    },
    removeMember: function(id){
        var curmembers = this.getMembers();
        for (var i=0;i<curmembers.length;i++){
            if (curmembers[i] == id) {
                curmembers.splice(i,1); //Remove from list
                this.data('members', curmembers);
                return true;
            }
        }
    },
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

window.Cow = window.Cow || {};
Cow.project = function(config){
    this._members = []; //array of ID
    if (!config._id) {throw 'No _id given for project';}
    var dbname = 'groups_' + config._id;
    this._groupStore = _.extend(
        new Cow.syncstore(dbname),{
        _records: [],
        _recordproto: function(){return new Cow.group();},
        _dbname: dbname,
        dbname:  function(name){
            this._dbname =  name;
        },
        getGroups: function(){
            return this._records;
        },
        getGroup: function(id){
            return this._getRecord(id);
        },
        addGroup: function(config){
            return this._addRecord(config);
        },
        updateGroup: function(config){
            return this._updateRecord(config);
        }
    });
    dbname = 'items_' + config._id;
    this._itemStore = _.extend(
        new Cow.syncstore(dbname),{
        _recordproto:   function(){return new Cow.item();},
        _records: [],
        _dbname: dbname,
        dbname:  function(name){
            this._dbname =  name;
        },
        getItems:       function(){
            return this._records;
        },
        getItem:        function(id){
            return this._getRecord(id);
        },
        addItem:        function(config){
            return this._addRecord(config);
        },
        updateItem:     function(config){
            return this._updateRecord(config);
        }
    });
};
Cow.project.prototype = 
{
    __proto__: Cow.record.prototype,
 
    groupStore: function(){
        return this._groupStore;
    },
    groups: function(){
        return this._groupStore.getGroups();
    },
 
    itemStore: function(){
        return this._itemStore;
    },
    items: function(){
        return this._itemStore.getItems();
    },
    
    getMembers: function(){
        return this._members;
    },
    addMember: function(id){
        var existing = false;
        for (var i=0;i<this._members.length;i++){
            if (this._members[i] == id) {
                existing = true; //Already a member
                return false;
            }
        }
        if (!existing){
            this.memberList.push(id); //Adding to the list
        }
        return id;
    },
    removeMember: function(id){
        for (var i=0;i<this._members.length;i++){
            if (this._members[i] == id) {
                this._members.splice(i,1); //Remove from list
                return true;
            }
        }
    }
    
    //populate: function(){ //Gets the groups and items for this project
        //this.groupStore().dbname('groups_'+ this._id);
        //this.groupStore().initDb();
        //this.itemStore().dbname('items_'+ this._id);
        //this.itemStore().initDb();
    //}

};

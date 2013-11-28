window.Cow = window.Cow || {};
Cow.project = function(){};
Cow.project.prototype = 
{
    __proto__: Cow.record.prototype,
    
    _groupStore: {
        __proto__:  Cow.syncstore.prototype, //Inherits from syncStore
        _recordproto:   Cow.group.prototype,
        _dbname: null,
        dbname:  function(name){
            this._dbname =  name;
        },
        getGroups: function(){},
        getGroup: function(ID){},
        addGroup: function(config){},
        updateGroup: function(config){},
        removeGroup: function(ID){}
    }, 
    groupStore: function(){
        return this._groupStore;
    },
    _itemStore: {
        __proto__:      Cow.syncstore.prototype, //Inherits from syncStore
        _recordproto:   Cow.item.prototype,
        _dbname:        null,
        dbname:  function(name){
            this._dbname =  name;
        },
        getItems:       function(options){},
        getItem:        function(ID){},
        addItem:        function(config){},
        updateItem:     function(config){},
        removeItem:     function(ID){}
    }, 
    itemStore: function(){
        return this._itemStore;
    },
    
    _members:[], //array of ID
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
    },
    
    populate: function(){ //Gets the groups and items for this project
        this.groupStore().dbname('groups_'+ this._id);
        this.groupStore().initDb();
        this.itemStore().dbname('items_'+ this._id);
        this.itemStore().initDb();
    }

};

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

Cow.group = function(config){
    //if (!config._id) {throw 'No _id given for group';}
    this._id = config._id;
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= 'true';
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
};
Cow.group.prototype = 
{
    /**
        members() - return array of member ids
        members(id) - add id to member array, return group object
        members([id]) - add id's to member array, return group object
    **/
    members: function(userid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getMembers();
            case 1:
                if (!Array.isArray(userid)) {
                    this._addMember(userid);
                    return this;
                }
                else if (Array.isArray(userid)){
                   for (var i = 0;i<userid.length;i++){
                       var d = userid[i];
                       self._addMember(d);
                   }
                   //return this._getMembers();
                   return this;
                }
                else {
                    throw('Wrong input: ' + userid);
                }
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getMembers: function(){
        return this.data('members') || [];
    },
    _addMember: function(userid){
        var existing = false;
        var memberList = this.members();
        for (var i=0;i<memberList.length;i++){
            if (memberList[i] == userid) {
                existing = true; //Already a member
            }
        }
        if (!existing){
            memberList.push(userid); //Adding to the list
            this.data('members', memberList);
            //TODO this.core.trigger('projectListChanged', this.core.UID);
        }
        return userid;
    },
    /**
        removeMember(id) - remove id from array of member id's, return group object
    **/
    removeMember: function(userid){
        var core = this._store._core;
        var memberList = this.members();
        for (var i=0;i<memberList.length;i++){

            if (memberList[i] == userid) {
                memberList.splice(i,1); //Remove from list
                this.data('members', memberList);
                //TODO core.trigger('projectListChanged', this.core.UID);
                return this;
            }
        }
    },
    /**
        removeAllMembers() - empty 
    **/
    removeAllMembers: function(){
        var memberList = [];
        this.data('members', memberList);
        return this;
    },
    //Next can be confusing: groups can be member of another group, hence the groups item in a group
    //They are not the same in functionality, the groups is only an array of group id's
    groups: function(groupid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getGroups();
            case 1:
                if (!Array.isArray(groupid)) {
                    return this._addGroup(groupid);
                }
                else {
                   for (var i=0;i<groupid.length;i++){
                   //$.each(groupid, function(i,d){
                     var d = groupid[i];
                     self._addGroup(d);
                   }
                   return this._getGroups();
                }
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getGroups: function(){
        return this.data('groups') || [];
    },
    _addGroup: function(groupid){
        var existing = false;
        var groupList = this.groups();
        for (var i=0;i<this.groupList.length;i++){
            if (groupList[i] == groupid) {
                existing = true; //Already a member
                return groupid;
            }
        }
        if (!existing){
            groupList.push(groupid); //Adding to the list
            this.data('groups',groupList);
            //TODO self.core.trigger('projectListChanged', this.core.UID);
        }
        return groupid;
    },
    removeGroup: function(groupid){
        var groupList = this.groups();
        for (var i=0;i<this.groupList.length;i++){
            if (groupList[i] == groupid) {
                groupList.splice(i,1); //Remove from list
                self.data('groups', groupList);
                //TODO self.core.trigger('projectListChanged', this.core.UID);
                return;
            }
        }
    },
    removeAllGroups: function(){
        var groupList = [];
        this.data('groups', groupList);
        //self.core.trigger('projectListChanged', this.core.UID);
    },
    //Find out if a peer is in a group
    hasMember: function(peerid){
        //See if member is in this group
        var hasmember = false;
        var memberList = this.members();
        for (var i=0;i<memberList.length;i++){
            if (memberList[i] == peerid) {
                hasmember = true;
            }
        }
        //See if member is in other group that inherits this group
        var groupsChecked = [this._id];
        var groupList = this.groups();
        var core = this._store._core;
        var projectid = this._store._projectid;
        for (var i=0;i<groupList.length;i++){
            var groupId = groupList[i].id;
            if (groupsChecked.indexOf(groupId) < 0){// avoid looping
                groupsChecked.push(groupId);
                var group = core.projects(projectid).groups(groupId);
                hasmember = group.hasMember(peerid);
            }
        }
        return hasmember;
    }
};
_.extend(Cow.group.prototype, Cow.record.prototype);
}.call(this));
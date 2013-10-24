$.Cow.Group.prototype = {
    members: function(peerid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getMembers();
                break;
            case 1:
                if (!$.isArray(peerid)) {
                    return this._addMember(peerid);
                }
                else {
                   $.each(peerid, function(i,d){
                           self._addMember(d);
                   });
                   return this._getMembers();
                }
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getMembers: function(){
        return this.memberList;
    },
    _addMember: function(peerid){
        var existing = false;
        for (var i=0;i<this.memberList.length;i++){
            if (this.memberList[i].id == peerid) {
                existing = true; //Already a member
                return peerid;
            }
        }
        if (!existing){

            this.memberList.push(peerid); //Adding to the list
            //self.core.trigger('projectListChanged', this.core.UID);
        }
        return peerid;
    },
    removeMember: function(peerid){
        for (var i=0;i<this.memberList.length;i++){

            if (this.memberList[i] == peerid) {
                this.memberList.splice(i,1); //Remove from list
                //self.core.trigger('projectListChanged', this.core.UID);
                return;
            }
        }
    },
    removeAllMembers: function(){
        this.memberList = [];
    },
    //Next can be confusing: groups can be member of another group, hence the groups item in a group
    //They are not the same in functionality, the groups is only an array of group id's
    groups: function(groupid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getGroups();
                break;
            case 1:
                if (!$.isArray(groupid)) {
                    return this._addGroup(groupid);
                }
                else {
                   $.each(groupid, function(i,d){
                     self._addGroup(d);
                   });
                   return this._getGroups();
                }
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getGroups: function(){
        return this.groupList;
    },
    _addGroup: function(groupid){
        var existing = false;
        for (var i=0;i<this.groupList.length;i++){
            if (this.groupList[i].id == groupid) {
                existing = true; //Already a member
                return groupid;
            }
        }
        if (!existing){
            this.groupList.push(groupid); //Adding to the list
            //self.core.trigger('projectListChanged', this.core.UID);
        }
        return groupid;
    },
    removeGroup: function(groupid){
        for (var i=0;i<this.groupList.length;i++){
            if (this.groupList[i] == groupid) {
                this.groupList.splice(i,1); //Remove from list
                //self.core.trigger('projectListChanged', this.core.UID);
                return;
            }
        }
    },
    removeAllGroups: function(){
        this.groupList = [];
        //self.core.trigger('projectListChanged', this.core.UID);
    },
    //Find out if a peer is in a group
    hasMember: function(peerid){
        //See if member is in this group
        var hasmember = false;
        for (var i=0;i<this.memberList.length;i++){
            //if (this.memberList[i].id == peerid && this.memberList[i].status != 'deleted') {
            if (this.memberList[i] == peerid)
                hasmember = true;
            
        }
        //See if member is in other group that inherits this group
        var groupsChecked = [this.uid];
        for (var i=0;i<this.groupList.length;i++){
            var groupId = groupList[i].id;
            if (groupsChecked.indexOf(groupId) < 0){// avoid looping
                groupsChecked.push(groupId);
                var group = this.core.getProjectById(this.core.activeproject()).getGroupById(groupId);
                hasmember = group.hasMember(peerid);
            }
        }
        return hasmember;
    },
    bind: function(types, data, fn) {
        var self = this;

        // A map of event/handle pairs, wrap each of them
        if(arguments.length===1) {
            var wrapped = {};
            $.each(types, function(type, fn) {
                wrapped[type] = function() {
                    return fn.apply(self, arguments);
                };
            });
            this.events.bind.apply(this.events, [wrapped]);
        }
        else {
            var args = [types];
            // Only callback given, but no data (types, fn), hence
            // `data` is the function
            if(arguments.length===2) {
                fn = data;
            }
            else {
                if (!$.isFunction(fn)) {
                    throw('bind: you might have a typo in the function name');
                }
                // Callback and data given (types, data, fn), hence include
                // the data in the argument list
                args.push(data);
            }

            args.push(function() {
                return fn.apply(self, arguments);
            });

            this.events.bind.apply(this.events, args);
        }

       
        return this;
    },
    trigger: function() {
        // There is no point in using trigger() insted of triggerHandler(), as
        // we don't fire native events
        this.events.triggerHandler.apply(this.events, arguments);
        return this;
    },
    // Basically a trigger that returns the return value of the last listener
    _triggerReturn: function() {
        return this.events.triggerHandler.apply(this.events, arguments);
    }
    
};



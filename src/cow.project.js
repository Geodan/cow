$.Cow.Project.prototype = {
    members: function(peerid){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getMembers();
                break;
            case 1:
                return this._addMember(peerid);
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
            if (this.memberList[i] == peerid) {
                existing = true; //Already a member
                return peerid;
            }
        }
        if (!existing)
            this.memberList.push(peerid); //Adding to the list
        return peerid;
    },
    removeMember: function(peerid){
        for (var i=0;i<this.memberList.length;i++){
            if (this.memberList[i] == peerid) {
                this.memberList.splice(i,1); //Remove from list
                return;
            }
        }
    },
    removeAllMembers: function(){
        this.memberList = [];
    },
    //GROUPS
    groups: function(options){
        var self = this;
        switch(arguments.length) {
            case 0:
                return this._getGroups();
                break;
            case 1:
                return this._addGroup(options);
                break;
            default:
                throw('wrong argument number');
        }
    },
    _getGroups: function(){
        return this.groupList;
    },
    _addGroup: function(options){
        if (!options._id || !options.name){
            throw('Missing group parameters '+JSON.stringify(options));
        }
        var group,i;
        var source = options.source;
        var existing = false;
        $.each(this.groupList, function(id, group) {
                if (options._id == group._id) {
                    i = id;
                    existing = true;
                }
        });
        if (existing == true){
            if (options.name){
             this.groupList[i].name = options.name; //Update name of group
             group = this.groupList[i];
            }
        }
        if (existing == false){
            group = new $.Cow.Group(this, options);
            if (options.peeruid){
                group.members(options.peeruid);
            }
            this.groupList.push(group); //Adding to the list
        }
        var toDB = function(){
            if (this.groupsdb){ 
                   this.core.groupsdb().bulkLoad_UI(this.project.getGroupsData());//Add public to be sure
            }
        }
        if (source != 'db'){
            toDB(); //Add to db when incoming data is not from db
        }
            
        
        //TODO: probably need trigger here
        return group;
    },
    removeGroup: function(_id){
        for (var i=0;i<this.groupList.length;i++){
            if (this.groupList[i]._id == _id) {
                this.groupList.splice(i,1); //Remove from list
                return;
            }
        }
    },
    removeAllGroups: function(){
        this.groupList = [];
    },
    myGroups: function(){
        var mygroups = [];
        $.each(this.groups(),function(i,d){
            if (d.hasMember(self.core.UID) == true){
                mygroups.push(d._id);
            }
        });
        return mygroups;
    },
    loadGroupsFromDb: function(d){
        var self = this;
        $.each(d.rows, function(i,d){
            self.groups(d.doc);
        });
    },
    
    getGroupById: function(_id){
        for (var i=0;i<this.groupList.length;i++){
            if (this.groupList[i]._id == _id) {
                return this.groupList[i];
            }
        }
        return;
    },
    
    //Get the plain groupsdata without the functions (needed to transfer data)
    getGroupsData: function(){
        var groups = [];
        $.each(this.groupList,function(i,d){
            
            var group = {
                _id: d._id.toString(),
                name: d.name,
                members: d.members(),
                groups: d.groups()
            };
            groups.push(group);
        });
        return groups;
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



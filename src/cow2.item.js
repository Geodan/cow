window.Cow = window.Cow || {};
Cow.item = function(config){
    if (!config || !config._id) {throw 'No _id given for item';}
    this._id = config._id;
    this._store = config.store;
};
Cow.item.prototype = 
{
    __proto__: Cow.record.prototype,
    /**
        Function to get or set the permissions:
        permissions() will return an array with all permissions set on this item
        permissions('type') will return an array with the permission of type 'type'
        permissions('type',group) will add the group to the permissions 
            of type 'type' (and create permission of type 'type' if needed), returns item
        permissions('type',[group]) will add the array of groups to the permissions 
            of type 'type' (and create permission of type 'type' if needed), returns item
    */
    permissions: function(type,groups) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return self.data('permissions');
        case 1:
            if(typeof type === "string") {
                return self._permissionsByType(type);
            }
            else {
                throw('type should be a string');
            }
            break;
        case 2: 
            if(typeof type === "string") {
                return self._setPermission(type, groups);
            }
            else {
                throw('type should be a string');
           }
           break;
        default:
            throw('wrong argument number');
        }
    
    },
    _permissionsByType: function(type) {
        
        //TT: this used to return an array, but afaik there can/should be only 1 permission per type
        //var returnval = [];
        var returnval = null;
        for (var i=0;i<this._permissions.length;i++){
            var permission = this._permissions[i];
            if (permission.type == type){
                //returnval.push(this._permissions[i]);
                returnval = permission;
            }
        }
        return returnval;
        /*OBS
        var result = $.grep(this._permissions, function(e){ 
                return e.type === type; 
        });
        return result;
        */
    },
    _setPermission: function(type,groups) {
        var self = this;
        var permission = this._permissionsByType(type);
        var permissions = this.permissions();
        if (!permission) {
            //new type
            if(!Array.isArray(groups)) {
                //single group
                permission = {'type':type,'groups':[groups]};
            }
            else {
               permission = {'type':type,'groups':groups};
            }
            permissions.push(permission);
        }
        else {
            if(!Array.isArray(groups)&&!self.permissionHasGroup(type,groups)) {            
                permission.groups.push(groups);
            }
            else {
                for (var i=0;i<groups.length;i++){
                //$.each(groups,function(i){
                    if(!self.permissionHasGroup(type,groups[i])) {
                        permission.groups.push(groups[i]);
                    }
                }
            }
        }
        this.data('permissions', permissions);
        return this;
    },
    /**
        function to check if a particular type contains a particular group
        returns true if it is the case, false in all other cases
    */
    permissionHasGroup: function(type,group) {
        var permission  = this.permissions(type);
        var ingroups = [];
        if (group && Array.isArray(group)){
                ingroups = group;
        }
        else if (group){
            ingroups.push(group);
        }
        if(permission.length===0) {
            return false;
        }
        else {
            var groups = permission[0].groups;
            if(groups.length === 0) {
                return false;
            }
            else {
                var doeshave = false;
                for (var i=0;i<groups.length;i++){
                //$.each(groups,function(i){
                    for (var j=0;j<ingroups.length;j++){
                    //$.each(ingroups, function(j){
                       if (groups[i] == ingroups[j]){
                           doeshave = true;
                       }
                    }
                }
                return doeshave;
            }
        }
    },
    hasPermission: function(type) {
        var core = this._store._core;
        var user = core.user().id();
        //TODO: use the new function
        var project = core.projects(this._store._projectid);
        var groups  = project.groups();
        var hasperm = false;
        var permittedgroups = this.permissions(type);
        if (permittedgroups){
            for (var i=0;i<permittedgroups.groups.length;i++){
            //$.each(permittedgroups[0].groups, function(key,value) {
                var value = permittedgroups.groups[i];
                if((project.groups(value) !== undefined) &&(project.groups(value).hasMember(user))) {
                    hasperm = true;
                }
            }
        }
        return hasperm;
    },
    /**
        function to remove a group from an permission type, or the entire type
        removePermission('type') removes the entire permission type from the item
        removePermission('type',[groups]) removes the groups from the permission type
    */
    removePermission: function(type,groups) {
        var self = this;
        var index, permission, i;
        switch(arguments.length) {
        case 0:
            throw("this function doesn't take no arguments");
        case 1:
            if(typeof type === "string") {
                index = null;
                for (i=0;i<self._permissions.length;i++){
                //$.each(self._permissions,function(i){
                    permission = self._permissions[i];
                    if(permission._type == type) {
                        index = i;
                    }
                }
                if(index >= 0) {
                    self._permissions.splice(index,1);
                }
                self.data('permissions', self._permissions);
                //self._timestamp = new Date().getTime();
                return self.permissions();
            }
            else {
                throw('type should be a string');
            }
            break;
        case 2: 
            if(typeof type === "string") {
                permission = self.permissions(type);
                if(permission.length>=0) {
                    var pgroups = permission[0].groups;
                    if(pgroups.length >= 0) {
                        if(!Array.isArray(groups)) {
                            index = null;
                            for (i=0;i<pgroups.length;i++){
                            //$.each(pgroups, function(i){
                                if(pgroups[i] == groups) {            
                                    index = i;
                                }            
                            }
                            if(index >= 0) {
                                pgroups.splice(index,1);
                            }
                        }
                        else {
                            for (i=0;i<groups.length;i++){                            
                            //$.each(groups,function(j) {
                                index = null;
                                for (j=0;j<pgroups.length;j++){
                                //$.each(pgroups, function(i){
                                    if(pgroups[j] == groups[i]) {            
                                        index = j;
                                    }                                    
                                }
                                if(index >= 0) {
                                    pgroups.splice(index,1);
                                }
                            }
                        }
                    }
                }
                //self._timestamp = new Date().getTime();
                self.data('permissions',self._permissions);
                return self.permissions();
            }
            else {
                throw('type should be a string');
            }
            break;
        default:
            throw('wrong argument number');
        }
    }
};

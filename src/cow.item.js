$.Cow.Item.prototype = {
/**
  read/write properties:
  permissions
  data
  status
  
  
  read only properties:
  _id
  _rev
  creator
  timestamp
  changeOwner
  type
 */
    
    /**
        Function to get or set the permissions:
        permissions() will return an array with all permissions set on this item
        permissions('type') will return an array with the permission of type 'type'
        permissions('type',group) will add the group to the permissions 
            of type 'type' (and create permission of type 'type' if needed
        permissions('type',[group]) will add the array of groups to the permissions 
            of type 'type' (and create permission of type 'type' if needed
    */
    permissions: function(type,groups) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return self._permissions;
        case 1:
            if(typeof type === "string") {
                return self._permissionsByType(type);
            }
            else throw('type should be a string');
            break;
        case 2: 
            if(typeof type === "string") {
                return self._setPermission(type, groups);
            }
            else throw('type should be a string');
            break;
        default:
            throw('wrong argument number');
        }
    
    },
    _permissionsByType: function(type) {
        var result = $.grep(this._permissions, function(e){ 
        return e.type === type; 
        });
        return result;
    },
    _setPermission: function(type,groups) {
        var self = this;
        var permission = this._permissionsByType(type);
        if(permission.length==0) {
            //new type
            if(!$.isArray(groups)) {
                //single group
                permission.push({'type':type,'groups':[groups]})
            }
            else {
               permission.push({'type':type,'groups':groups})
            }
            this._permissions.push(permission[0]);
        }
        else {
            if(!$.isArray(groups)&&!self.permissionHasGroup(type,groups)) {            
                permission[0].groups.push(groups);
            }
            else {
                $.each(groups,function(i){
                    if(!self.permissionHasGroup(type,groups[i])) {
                        permission[0].groups.push(groups[i]);
                    }
                });
            }
        }
        return this.permissions();
    },
    /**
        function to check if a particular type contains a particular group
        returns true if it is the case, false in all other cases
    */
    permissionHasGroup: function(type,group) {
        var permission  = this.permissions(type);
        if(permission.length==0) {
            return false;
        }
        else {
            var groups = permission[0].groups;
            if(groups.length == 0) {
                return false;
            }
            else {
                var doeshave = false;
                $.each(groups,function(i){
                    if(groups[i] == group) doeshave = true
                });
                return doeshave;
            }
        }
    },
    /**
        function to remove a group from an permission type, or the entire type
        removePermission('type') removes the entire permission type from the item
        removePermission('type',[groups]) removes the groups from the permission type
    */
    removePermission: function(type,groups) {
        var self = this;
        switch(arguments.length) {
        case 0:
            throw("this function doesn't take no arguments");
        case 1:
            if(typeof type === "string") {
                var index;
                $.each(self._permissions,function(i){
                    if(this.type == type) {
                        index = i;
                    }
                });
                if(index >= 0) self._permissions.splice(index,1);
                return self.permissions();
            }
            else throw('type should be a string');
            break;
        case 2: 
            if(typeof type === "string") {
                var permission = self.permissions(type);
                if(permission.length>=0) {
                    var pgroups = permission[0].groups;
                    if(pgroups.length >= 0) {
                        if(!$.isArray(groups)) {
                            var index;
                            $.each(pgroups, function(i){
                                if(this == groups) {            
                                    index = i;
                                }            
                            });
                            if(index >= 0) pgroups.splice(index,1);
                        }
                        else {                            
                            $.each(groups,function(j) {
                                var index
                                $.each(pgroups, function(i){
                                    if(this == groups[j]) {            
                                        index = i;
                                    }                                    
                                });
                                if(index >= 0) pgroups.splice(index,1);
                            });
                        }
                    }
                }
                return self.permissions();
            }
            else throw('type should be a string');
            break;
        default:
            throw('wrong argument number');
        }
    },
    data: function(options) {
    
    },
    status: function(options) {
    
    },
    id: function() {
    
    },
    revision: function() {
    
    },
    creator: function() {
    
    },
    timestamp: function() {
    
    },
    changeOwner: function() {
    
    },
    type: function() {
    
    }
};
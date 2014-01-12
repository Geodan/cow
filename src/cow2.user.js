window.Cow = window.Cow || {};
Cow.user = function(config){
    if (!config._id) {throw 'No _id given for user';}
    this._id = config._id;
    this._store = config.store;
};
Cow.user.prototype = 
{
    __proto__: Cow.record.prototype,
    name: function(name){
        if (name){
            return this.data('name', name);
        }
        return this.data('name');
    },
    mail: function(mail){
        if (mail){
            return this.data('mail', mail);
        }
        return this.data('mail');
    },
    /**
        isActive() - returns wether or not the user is connected to a peer at the moment
    **/
    isActive: function(){
        var returnVal = false;
        var peers = this._store._core.peers();
        for (var i = 0;i < peers.length;i++){
            if (peers[i].user() == this._id && !peers[i].deleted()){
                returnVal = true;
            }
        }
        return returnVal;
    },
    /**
        groups() - returns an array of groups that the user is member of
    **/
    groups: function(){
        var core = this._store._core;
        var returnArr = [];
        var groups = core.project().groups();
        for (var i = 0;groups.length;i++){
            if (groups[i].hasMember(core.user().id())){
                returnArr.push(groups[i]);
            }
        }
        return returnArr;
    },
    /** 
        activeprojects() - returns array of active projects
        activeprojects(id) - adds project to array of active projects
        activeprojects(id,true) - removes project from array of active projects
    **/
    activeprojects: function(projectid, deleteme){
        var projectarr = this.data('activeprojects') || [];
        if (projectid && deleteme){
            var idx = projectarr.indexOf(projectid);
            projectarr.splice(idx,1);
            return this.data('activeprojects',projectarr);
        }
        if (projectid){
            projectarr.push(projectid);
            return this.data('activeprojects',projectarr);
        }
        return this.data('activeprojects') || [];
    },
    /** 
        mutedprojects() - returns array of muted projects
        mutedprojects(id) - adds project to array of muted projects
        mutedprojects(id,true) - removes project from array of muted projects
    **/
    mutedprojects: function(projectid, deleteme){
        var projectarr = this.data('mutedprojects') || [];
        if (projectid && deleteme){
            var idx = projectarr.indexOf(projectid);
            projectarr.splice(idx,1);
            return this.data('mutedprojects',projectarr);
        }
        if (projectid){
            projectarr.push(projectid);
            return this.data('mutedprojects',projectarr);
        }
        return this.data('mutedprojects') || [];
    }
    
};

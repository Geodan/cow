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

Cow.user = function(config){
    //if (!config._id) {throw 'No _id given for user';}
    this._id = config._id  || new Date().getTime().toString();
    this._store = config.store;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= true;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data  = {};
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};
Cow.user.prototype = 
{
    /*
    TT: made obsolete, not in the scope of cow
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
    */
    /**
        isActive() - returns wether or not the user is connected to a peer at the moment
        TT: Might be obsolete, was used by core.activeUsers()
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
        if (!core.project()){
            console.warn('No active project');
            return null;
        }
        var groups = core.project().groups();
        for (var i = 0;groups.length;i++){
            if (groups[i].hasMember(core.user().id())){
                returnArr.push(groups[i]);
            }
        }
        return returnArr;
    }
    /** 
        activeprojects() - returns array of active projects
        activeprojects(id) - adds project to array of active projects
        activeprojects(id,true) - removes project from array of active projects
    **/
    /* TT: obsolete
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
    },*/
    /** 
        mutedprojects() - returns array of muted projects
        mutedprojects(id) - adds project to array of muted projects
        mutedprojects(id,true) - removes project from array of muted projects
    **/
    /* TT: obsolete
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
    }*/
    
};
_.extend(Cow.user.prototype, Cow.record.prototype);
}.call(this));
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

Cow.core = function(config){
    var self = this;
    if (typeof(config) == 'undefined' ) {
        config = {};
    }
    
    this._herdname = config.herdname || 'cow';
    this._userid = null;
    this._socketserverid = null;
    this._projectid = null;
    this._wsUrl = null;
    this._peerid = null;
    this._maxAge = config.maxage || 1000 * 60 * 60 * 24 * 30; //30 days in mseconds
    
    
    /*LOCALDB*/
    this._localdb = new Cow.localdb({dbname: this._herdname, core: this});
    
    /*PROJECTS*/
    this._projectStore =  _.extend(
        new Cow.syncstore({dbname: 'projects', noDeltas: true, core: self, maxAge: this._maxAge}),{
        _records: [],
        _recordproto:   function(_id){return new Cow.project({_id:_id, store: this});},
        _dbname:        'projects',
        _type:          'projects'
    });
    
    
    /*PEERS*/
    this._peerStore =  _.extend(
        new Cow.syncstore({dbname: 'peers', noIDB: true, noDeltas: true, core: this, maxAge: this._maxAge}), {
         _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.peer({_id: _id, store: this});}, 
        _dbname: 'peers',
        _type: 'peers',
        //remove peer from _peers
        removePeer:         function(id){
            return this._removeRecord(id);
        }
    });
    
    /*USERS*/
    this._userStore =  _.extend(
        new Cow.syncstore({dbname: 'users', noDeltas: true, core: this, maxAge: this._maxAge}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.user({_id: _id, store: this});},     
        _dbname:        'users',
        _type:          'users'
    });
    
    /*SOCKETSERVERS*/
    this._socketserverStore =  _.extend(
        new Cow.syncstore({dbname: 'socketservers', noDeltas: true, core: this, maxAge: this._maxAge}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.socketserver({_id: _id, store: this});},     
        _dbname:        'socketservers',
        _type:          'socketservers'
    });
    
    /*WEBSOCKET*/
    //this._websocket = new Cow.websocket({url: this._wsUrl, core: this});
    this._websocket = new Cow.websocket({core: this, url: this._wsUrl});
    
    /*MESSENGER*/
    this._messenger = new Cow.messenger({core:this});
    
};

Cow.core.prototype = 
{
    /**
        peerid() -- get the current peerid
        peerid(id) -- set the current peerid
    **/
    peerid: function(id){
        if (id){
            this._peerid = id.toString();
            return this._peerid;
        }
        else if (this._peerid){
            return this._peerid.toString();
        }
        return null;
    },
   
    /**
        project() -- get current project object
        project(id) -- set current project based on id from projectStore
        TODO:
        to discuss: with the current code it is not needed to have only 1 project active
            in theory the UI part can deal with that while the core can deal with multiple projects at the same time
    **/
    project: function(id){
        if (id){
            id = id.toString();
            var project = this.projects(id); 
            if (!project){
                console.warn('Trying to select a non existing project');
                return false;
            }
            this._projectid = id;
            if (this.peer()){
                this.peer().data('activeproject',id).sync();
            }
            this.trigger('projectChanged');
            return true;
        }
        else {
            if (!this._projectid) {
                return false;
            }
            return this.projects(this._projectid); 
        }
    },
    
    /**
        user() - get current user object
        user(id) - set current user based on id from userStore, return user object
    **/
    user: function(id){
        if (id){
            id = id.toString();
            this._userid = id;
            //Add user to peer object
            if (this.peer() && this.peers(this.peerid())){
                this.peer().data('userid',id).sync();
            }
            return this.users(id);
        }
        else {
            if (!this._userid) {
                return false;
            }
            return this.users(this._userid); 
        }
    },
    /**
        socketserver() - return my socketserver object
    **/
     socketserver: function(id){
        if (id){
            id = id.toString();
            this._socketserverid = id;
            return this.socketservers(id);
        }
        else {
            if (!this._socketserverid) {
                return false;
            }
            return this.socketservers(this._socketserverid);
        }
     },
    
    /**
        peer() - return my peer object
    **/
    peer: function(){
        if (this.peerid()){
            return this.peers(this.peerid());
        }
        else {
            return false;
        }
    },
    /**
        location() - get the last known location
        location(location) - set the current location
    **/
    location:   function(location){
        if (location){
            this._location = location;
            if (this.peerid()){
                this.peers(this.peerid()).data('location',location).sync();
            }
            return this._location;
        }
        else {
            return this._location;
        }
        
    },
    /**
        projectStore() - returns the _projectstore object
    **/
    projectStore:       function(){
        return this._projectStore;
    }, 
    
    /**
        projects() - returns array of all projects
        projects(id) - returns project with id (or null)
        projects({config}) - creates and returns project
    **/
    projects:       function(config){
            return this._projectStore.records(config);
    },
    /**
        peerStore() - returns the _peerstore object
    **/
    peerStore:  function(){
        return this._peerStore;
    },
    /**
        peers() - returns array of all peers
        peers(id) - returns peer with id (or null)
        peers({config}) - creates and returns peer
    **/
    peers:              function(config){
        return this._peerStore.records(config);
    },
    /**
        socketserverStore() - returns the _socketserverstore object
    **/
    socketserverStore:  function(){
        return this._socketserverStore;
    },
    /**
        socketservers() - returns array of all socketservers
        socketservers(id) - returns socketserver with id (or null)
        socketservers({config}) - creates and returns socketserver
    **/
    socketservers:      function(config){
        return this._socketserverStore.records(config);
    },
    /**
        userStore() - returns the _userstore object
    **/
    userStore:      function(){
        return this._userStore;
    }, 
    /**
        users() - returns array of all users
        users(id) - returns user with id (or null)
        users({config}) - creates and returns user
    **/
    users:       function(config){
        return this._userStore.records(config);
    }, 
    /**
        activeUsers() - returns array with userobjects that are currently active
    **/
    activeUsers: function(){
        var returnArr = [];
        var users = this.users();
        for (var i = 0;i<users.length;i++){
            if (users[i].isActive()){
                returnArr.push(users[i]);
            }
        }
        return returnArr;
    },
    /**
        localdbase() - return the open promise of the localdbase
    **/
    dbopen: function(){
        return this._localdb._openpromise;
    },
    /**
        websocket() - return the _websocket object
    **/
    websocket: function(){
        return this._websocket;
    },
    /**
        messenger() - return the _messenger object
    **/
    messenger: function(){
        return this._messenger;
    },
    /**
        localdb() - return the _localdb object
    **/
    localdb: function(){
        return this._localdb;
    },
    /**
        connect() - starts the websocket connection, returns connection promise
    **/
    connect: function(){
        return this._websocket.connect();
    },
    /**
        disconnect() - disconnects the websocket
    **/
    disconnect: function(){
        return this._websocket.disconnect();
    }
};
//Adding some Backbone event binding functionality to the store
_.extend(Cow.core.prototype, Events);

}.call(this));
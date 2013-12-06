Cow.core = function(config){
    var self = this;
    if (!config.wsUrl){throw('No wsURL given');}
    this._userid = null;
    this._wsUrl = config.wsUrl || 'wss://localhost:443';
    this._peerid = null;
    
    /*WEBSOCKET*/
    this._websocket = new Cow.websocket({url: this._wsUrl, core: this});
    
    /*PROJECTS*/
    this._projectStore =  _.extend(
        new Cow.syncstore({dbname: 'projects', core: self}),{
        _records: [],
        _recordproto:   function(_id){return new Cow.project({_id:_id, store: this});},
        _dbname:        'projects',
        _type:          'projects'
    });
    
    /*PEERS*/
    this._peerStore =  _.extend(
        new Cow.syncstore({dbname: 'peers', noIDB: true, core: this}), {
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
        new Cow.syncstore({dbname: 'users', core: this}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.user({_id: _id, store: this});},     
        _dbname:        'users',
        _type:          'users'
    });
    
};
Cow.core.prototype = 
{
    peerid: function(id){
        this._peerid = id || this._peerid;
        return this._peerid;
    },
   
    /**
        user() - get current user object
        user(id) - set current user based on id from userStore
    **/
    user: function(id){
        if (id){
            this._userid = id;
            //Add user to peer object
            if (this.peerid()){
                this.peers(this.peerid()).data('userid',id).sync();
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
    
    projectStore:       function(){
        return this._projectStore;
    }, //returns the _projectstore object
    
    /**
        projects() - returns array of all projects
        projects(id) - returns project with id (or null)
        projects({config}) - creates and returns project
    **/
    projects:       function(config){
            return this._projectStore.records(config);
    },
    
    peerStore:  function(){
        return this._peerStore;
    },
    peers:              function(config){
        return this._peerStore.records(config);
    },
    
    //return the _userStore object
    userStore:      function(){
        return this._userStore;
    }, 
    //return the user objects
    users:       function(config){
        return this._userStore.records(config);
    }, 
    
    //return the _websocket object
    websocket: function(){
        return this._websocket;
    } 
};

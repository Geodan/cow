Cow.core = function(config){
    var self = this;
    if (!config.wsUrl){throw('No wsURL given');}
    this._wsUrl = config.wsUrl;
    this._peerid = new Date().getTime();
    /*WEBSOCKET*/
    this._websocket = new Cow.websocket({url: this._wsUrl, core: this});
    
    /*PROJECTS*/
    this._projectStore =  _.extend(
        new Cow.syncstore({dbname: 'projects', core: this}),{
        _records: [],
        _recordproto:   function(_id){return new Cow.project({_id:_id, core: self});},
        _dbname:        'projects',
        _type:          'projects',
        getProjects:    function(){ //returns all projects
            return this._records;
        }, 
        getProject:     function(id){ //returns 1 project
            return this._getRecord(id);
        }, 
        addProject:     function(config){ //adds (and returns) 1 project
            return this._addRecord(config);
        }, 
        updateProject:  function(config){ //changes and returns 1 project
            return this._updateRecord(config);
        }
    });
    
    /*PEERS*/
    this._peerStore =  _.extend(
        new Cow.syncstore({dbname: 'peers', noIDB: true, core: this}), {
         _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.peer({_id: _id, core: self});}, 
        _dbname: 'peers',
        _type: 'peers',
        //returns all peer objects
        getPeers:           function(){
            return this._records;
        },
        getPeer:            function(id){
            return this._getRecord(id);
        }, 
        addPeer:            function(config){
            return this._addRecord(config);
        },
        updatePeer:         function(config){
            return this._updateRecord(config);
        },
        //remove peer from _peers
        removePeer:         function(id){
            return this._removeRecord(id);
        },
        //returns featurecollection of peerextents
        getPeerExtents:     function(){
            //TODO
        },
        //returns featurecollection of peerpositions
        getPeerPositions:   function(){
            //TODO
        }
    });
    
    /*USERS*/
    this._userStore =  _.extend(
        new Cow.syncstore({dbname: 'users', core: this}), {
        _records: [],
        //prototype for record
        _recordproto:   function(_id){return new Cow.user({_id: _id});},     
        _dbname:        'users',
        _type:          'users',
        getUsers:       function(){
            return this._records;
        },
        getUser:        function(id){
            return this._getRecord(id);
        },
        addUser:        function(config){ 
            return this._addRecord(config);
        }, 
        updateUser:     function(config){ 
            return this._updateRecord(config); 
        }
        
    });
    
};
Cow.core.prototype = 
{
    peerid: function(id){
        this._peerid = id || this._peerid;
        return this._peerid;
    },
    
    projectStore:       function(){
        return this._projectStore;
    }, //returns the _projectstore object
    
    projects:       function(){
        return this._projectStore.getProjects();
    }, //returns the project objects
    
    peerStore:  function(){
        return this._peerStore;
    },
    peers:              function(){
        return this._peerStore.getPeers();
    },
    
    //return the _userStore object
    userStore:      function(){
        return this._userStore;
    }, 
    //return the user objects
    users:       function(){
        return this._userStore.getUsers();
    }, 
    
    //return the _websocket object
    websocket: function(){
        return this._websocket;
    } 
};

Cow.core = function(){};
Cow.core.prototype = 
{
    /*
    MYSPECS
    */
    _mySpecs: { //Contain
        _location:  null,   //
        _logontime: null   //timestamp
    },   
    
    
    /*PROJECTS*/
    _projectStore:  Object.create(Cow.syncstore.prototype,{ //Inherits from syncStore
        getProjects:    function(){}, //returns all projects
        getProject:     function(ID){}, //returns 1 project
        addProject:     function(config){}, //adds (and returns) 1 project
        updateProject:  function(config){}, //changes 1 project
        removeProject:  function(ID){} //set status to inactive
    }),
    projectStore:       function(){
        return this._projectStore;
    }, //returns the _projectstore object
    
    /*PEERS*/
    _peers:             [], //array of peer
    getPeers:           function(){}, //returns all peer objects
    getPeer:            function(ID){}, //return 1 peer
    addPeer:            function(config){},
    updatePeer:         function(config){},
    removePeer:         function(ID){}, //remove peer from _peers
    getPeerExtents:     function(){}, //returns featurecollection of peerextents
    getPeerPositions:   function(){},//returns featurecollection of peerpositions
    
    /*USERS*/
    _userStore:     Object.create(Cow.syncstore.prototype,{ //Inherits from syncStore
        getUsers:       function(){},
        getUser:        function(ID){},
        addUser:        function(config){}, //returns user object
        updateUser:     function(config){},
        removeUser:     function(ID){}//sets user inactive (should only be allowed to admin)
    }),
    userStore:      function(){}, //returns the _userStore object
    
    /*WEBSOCKET*/
    _websocket: {
        _connection: {
            //socket connection object
        },
        connect: function(URL){},
        disconnect: function(){},
        sendData: function(data, action, target){},
        _onMessage: function(d){},
        _onClose: function(e){},
        _onConnect: function(d){},
        _onError: function(e){}
        //... follows a whole set of internal functions that handle the COW message protocol
        // this could be called the 'heart' of the software 
    },
    websocket: function(){} //returns the _websocket object
};

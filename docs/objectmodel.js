_synstore: //Synstore keeps track of records 
{
    _pouchdb: {}, //pouchdb object
    _
    
    
}
group: 
{
    _users: [ID], //Possibly we can forget about keeping track of users in the group
    _groups: [ID], //
    getUsers: function(){},
    addUser: function(ID){},
    removeUser: function(ID){},
    
}

project:
{
    _groupStore:{
        _records: [group],
        getGroups: function(){},
        getGroup: function(ID){},
        addGroup: function(config){},
        updateGroup: function(config){},
        removeGroup: function(ID){}
    }, //Inherits from syncStore
    
    _itemstore:{}, //Inherits from syncStore
    
    _members:[]
}

{
    core: {
        /*MYSPECS*/
        _mySpecs: { //Contain
        
        
        
        /*PROJECTS*/
        _projectStore:  { //Inherits from syncStore
            _records: [project],
            getProjects: function(){}, //returns all projects
            getProject: function(ID){}, //returns 1 project
            addProject: function(config){}, //adds (and returns) 1 project
            updateProject: function(config){} //changes 1 project
            removeProject: function(ID){} //set status to inactive
        },
        projectStore: function(), //returns the _projectstore object
        
        /*PEERS*/
        _peers:     [peer],
        getPeers: function(){}, //returns all peer objects
        getPeer: function(ID){}, //return 1 peer
        addPeer: function(config){},
        updatePeer: function(config){},
        removePeer: function(ID){}, //remove peer from _peers
        getPeerExtents: function(){}, //returns featurecollection of peerextents
        getPeerPositions: function(){},//returns featurecollection of peerpositions
        
        /*USERS*/
        _userStore:     { //Inherits from syncStore
            _records: [user],
            getUsers: function(){},
            getUser: function(ID){},
            addUser: function(config){}, //returns user object
            updateUser: function(config){},
            removeUser: function(ID){}//sets user inactive (should only be allowed to admin)
        },
        userStore: function(){}, //returns the _userStore object
        
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
            _onError: function(e){},
            //... follows a whole set of internal functions that handle the COW protocol
            
            
        },
        websocket: function(){} //returns the _websocket object
    }
}

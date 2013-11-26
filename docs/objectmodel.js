{_synstore:
}
project:
{
    _groupstore:{}, //Inherits from syncStore
    _itemstore:{}, //Inherits from syncStore
    _members:[]
}

{
    core: {
        _projectStore:  { //Inherits from syncStore
            _records: [project],
            getProjects: function(){}, //returns all projects
            getProject: function(ID){}, //returns 1 project
            addProject: function(config){}, //adds (and returns) 1 project
            updateProject: function(config){} //changes 1 project
            removeProject: function(ID){} //set status to inactive
        },
        projectStore: function(), //returns the _projectstore object
        
        _peers:     [
            
        ],
        getPeers: function(){}, //returns all peer objects
        getPeer: function(ID){}, //return 1 peer
        addPeer: function(config){},
        updatePeer: function(config){},
        
        _userStore:     { //Inherits from syncStore
            _records: [user],
            getUsers: function(){},
            getUser: function(ID){},
            addUser: function(config){}, //returns user object
            updateUser: function(config){},
            removeUser: function(ID){}//sets user inactive (should only be allowed to admin)
        },
        userStore: function(){}, //returns the _userStore object
        
        _websocket: {
            _connection: {
                //socket connection object
            },
            connect: function(URL){},
            disconnect: function(){},
            sendData: function(data, action, target){},
            _onMessage: function(){},
            _onClose: function(e){},
            _onConnect: function(d){},
            _onError: function(e){},
            //... follows a whole set of internal functions that handle the COW protocol
            
            
        },
        websocket: function(){} //returns the _websocket object
    }
}

window.Cow = window.Cow || {};

Cow.db = function(){};
Cow.db.prototype = 
{
    //All these calls will be asynchronous and thus returning a promise instead of data
    _init: function(config){},
    _addRecord: function(config){}, //returns promise 
    _updateRecord: function(config){}, //returns promise
    _getRecords: function(){},  //returns promise
    _getRecord: function(id){}, //returns promise
    _removeRecord: function(id){} //returns promise
};
Cow.record = function(){};
Cow.record.prototype = {
    getStatus: function(){},
    setStatus: function(status){},
    data: function(param, value){}, // data() -> get all data, data(key) -> get value, data(key,value) -> set value
    deflate: function(){},
    inflate: function(config){}            
};
    
Cow.syncstore =  function(){}; //Synstore keeps track of records
Cow.syncstore.prototype = 
{
    _db: Object.create(Cow.db.prototype),
    initDb: function(name){},   //Create/Open the dbase for use
    initRecords: function(){}, //This will start the process of getting records from pouchdb (returns promise)

    _records: [],
    _getRecords: function(IDarray){}, //returns all records, if ID array is filled, only return that records 
    _getRecord: function(ID){},
    _addRecord: function(config){},
    _updateRecord: function(config){},

    _syncRecords: function(data){} //Compare ID/status array from other peer with your list and returns requestlist and pushlist  
};

Cow.item = function(){};
Cow.item.prototype = 
{
    __proto__: Cow.record

};

Cow.group = function(){};
Cow.group.prototype =
{
    __proto__: Cow.record,
    //Possibly we can forget about keeping track of all the users in the group
    //we only care about what group we are in ourselves
    _users: [], //array of IDs 
    _groups: [], //array of IDs
    getUsers: function(){},
    addUser: function(ID){},
    removeUser: function(ID){}
};

Cow.project = function(){};
Cow.project.prototype = 
{
    __proto__: Cow.record.prototype,
    _groupStore: {
        __proto__:      Cow.syncstore.prototype, //Inherits from syncStore
        _recordproto:   Cow.group.prototype,
        _dbname: null,
        dbname:  function(name){}, //Set name of dbase (based on project it is in)
        getGroups: function(){},
        getGroup: function(ID){},
        addGroup: function(config){},
        updateGroup: function(config){}
    }, 
    groupStore: function(){},//return _groupStore
    _itemStore: {
        __proto__:      Cow.syncstore.prototype, //Inherits from syncStore
        _recordproto:   Cow.item.prototype,
        _dbname:        null,
        dbname:  function(name){},//Set name of dbase (based on project it is in)
        getItems: function(options){},
        getItem: function(ID){},
        addItem: function(config){},
        updateItem: function(config){}
    }, 
    itemStore: function(){},//returns _itemStore
    _members:[], //array of ID
    getMembers: function(){},
    addMembers: function(ID){},
    removeMembers: function(ID){},
    populate: function(){} //populates the groups and items for this project from db
};


Cow.peer = function(){};
Cow.peer.prototype = 
{
    _extent: {},    //object
    _position: {},  //object
    _owner: null,   //ID
    _video: {state: 'off'}, //object
    _device: {}    //object (future use)
    
    
};

Cow.user = function(){};
Cow.user.prototype = 
{
    __proto__: Cow.record.prototype,
    _name: null,
    _mail: null,
    getName: function(){},
    getMail: function(){}
};

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
    _projectStore:  { 
        __proto__:      Cow.syncstore.prototype, //Inherits from syncStore
        _recordproto:   Cow.project.prototype,
        _dbname:        'projects',
        getProjects:    function(){}, //returns all projects
        getProject:     function(ID){}, //returns 1 project
        addProject:     function(config){}, //adds (and returns) 1 project
        updateProject:  function(config){}, //changes 1 project
    },
    projectStore:       function(){}, //returns the _projectstore object
    
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
    _userStore:  { 
        __proto__:      Cow.syncstore.prototype, //Inherits from syncStore
        _recordproto:   Cow.user.prototype,     //prototype for record
        _dbname:        'users',
        getUsers:       function(){},
        getUser:        function(ID){},
        addUser:        function(config){}, //returns user object
        updateUser:     function(config){}
    },
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

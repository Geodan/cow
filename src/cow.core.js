(function ($) {

$.Cow = $.Cow || {};

/**
#Cow.Core

The Cow.Core object. It is automatically constructed from the options
given in the `cow([options])` constructor. 
 */
$.Cow.Core = function(element, options) {
    var self = this;
    var time = new Date();
    this.UID = time.getTime(); 
    /* SMO: obsolete 7/8/2013
    this.MYLOCATION = "My location";
    this.LOCATION_ICON = './mapicons/male.png';
    this.MYLOCATION_ICON = './mapicons/you-are-here-2.png';
    this.current_icon;
    */
    this.options = $.extend({}, new $.fn.cow.defaults.core(), options);
    this.element = element;
    this.map = window[this.options.map];
    this.ws ={};
    this.peerList = [];
    this.projectList = [];
    this.groupList = [];
    this._username = 'Anonymous';
    this.project; //This will become the active project object
    this.activeProject = 666; //Carefull, order matters! Make sure the activeProject is set before localdbase is initialized
    this.localDbase;
    this.projectsDb;
    this.groupsDb;
    this.itemsDb;
    this.geoLocator;
    this.items;
    this.events = $({});
    if(this.options.websocket!==undefined) {
        this.websocket(this.options.websocket);
    }
    if(this.options.itemstore!==undefined) {
        this.itemstore(this.options.itemstore);
    }
    if(this.options.projectsdb!==undefined) {
        this.projectsdb(this.options.projectsdb);
    }
    if(this.options.groupsdb!==undefined) {
        this.groupsdb(this.options.groupsdb);
    }
    if(this.options.itemsdb!==undefined) {
        this.itemsdb(this.options.itemsdb);
    }/*
    if(this.options.localdbase!==undefined) {
        this.localdbase(this.options.localdbase);
    }*/
    if(this.options.geolocator!==undefined) {
        this.geolocator(this.options.geolocator);
    }
    
    element.data('cow', this);
    //Standard project, always available
    var startproject = this.projects({_id:666,name:"sketch", peeruid: this.UID}); //Add after localdb has been initialized
    //Standard public group, always available
    var startgroup = startproject.groups({_id:1, name: 'public', peeruid:this.UID});
    
    //Loading existing projects from dbase
    if (this.projectsdb){
        this.projectsdb().getRecords().done(function(d){
           self.loadProjectsFromDb(d);
        });
    }
    
    self.bind("disconnected", {widget: self}, self.removeAllPeers);
    
    //TODO: put this in a proper function
    self.bind('changeProjectRequest', {widget:self}, function(e,uid){
        self.itemstore().removeAllItems(); //Clear itemstore
        self.activeproject(uid);
        self.options.storename = "store_"+uid; //TODO: the link between activeProject and storename can be better
        //var items = self.localdbase().itemsdb();//Fill itemstore with what we have
    });    
};
/**
#Cow.Websocket

The Cow.Websocket object. It is constructed with ws options object in the
cow.`websocket([options])` function or by passing a `websocket:{options}` object in
the `cow()` constructor. 

example: websocket: {url: 'wss://80.113.1.130:443/'}
 */
$.Cow.Websocket = function(core, options) {
    var self = this;
    this.core = core;
    this.options = options;
    this.events = $({});
    //TODO: if connection cannot be established inform the user
    if (!this.ws || this.ws.readyState != 1) //if no connection
    {
        if(this.options.url && this.options.url.indexOf('ws') ==0) {
            this.url = this.options.url;
            this.openws(this.url)
        }
    }
    this.core.bind('meChanged', {widget: self}, self._onMeChanged);
/*    this.core.bind('moveend', {widget: self}, self._onMapMoved);
    this.core.bind('mylocationChange', {widget:self}, self._onLocationChanged);
    this.core.bind('paramChange', {widget:self}, self._onParamsChanged);
  */  
    //SMO: waarom?
    //return this;
    this.handlers = {
        // Triggers the jQuery events, after the OpenLayers events
        // happened without any further processing
        simple: function(data) {
            this.trigger(data.type);
        }
    };
    
};


/**
#Cow.Peer

The Cow.Peer object. It is constructed from within cow, it contains information
on a connected peer. The core.peerList contains 
a list of Cow.Peer objects, including the special 'me' peer

 */
$.Cow.Peer = function(core, options) {
    var self = this;
    this.core = core;
    this.options = options;
    this.uid = options.uid;
    this.bbox;
    this.params = {};
    this.viewfeature;
    this.events = $({});
    
    this.events.bind('ws-updatePeer', {widget: self}, self._onUpdatePeer);

    
    if(this.options.extent!==undefined) {
        this.view({"extent": this.options.extent});
    };
    
    
    this.handlers = {
        // Triggers the jQuery events, after the OpenLayers events
        // happened without any further processing
        simple: function(data) {
            this.trigger(data.type);
        },
        //TT: What does this do?
        includeFeature: function(data) {
            var feature = data.feature;
            this.trigger(data.type, [feature]);
        }
    };
};

$.Cow.Project = function(core, options) {
    var self = this;
    this.core = core;
    this.options = options;
    this._id = options._id;
    this.memberList = [];
    this.groupList = [];
}

$.Cow.Group = function(core, options) {
    var self=this;
    this.core = core;
    this.options = options;
    this._id = options._id;
    this.name = options.name || "noname";
    this.memberList = options.memberList || [];
    this.groupList = [];
}

/**
    $.Cow.Item object
    This is used to share data around, it contains metadata; eg owner, _id, _rev and permissions
    and data: eg. a geojson for a feature
    to initialise an Item object, give it at least an id, rev and type
*/
$.Cow.Item = function(core, options) {
    var self=this;
    
    //this.core = core; //We don't need the core in an item, do we?!   
    this._creator   = options.creator;
    this._timestamp = options.timestamp || new Date().getTime();
    this._changer   = options.changer;
    //this.options = options.data; //removed in favour of _data
    this._id        = options._id;
    this._rev       = options._rev;
    this._type      = options.type;
    this._permissions = options.permissions || [];
    this._status    = options.status || 'active';
    this._data      = options.data;
    
}

/***
$.Cow.LocalDbase object
Accessed from the core the localbase.
On creation it also populates the itemstore.
***/
$.Cow.LocalDbase = function(core, options) {
    var self = this;
    this.loaded = false;
    this.core = core;
    this.options = options;
    this.options.dbname = "cow";
    // items in sketch are not loaded anymore after x secs
    this.options.expirytime = 1 * 12 * 60 * 60; //1/2 day
    //this.options.expirytime = 7 * 24 * 60 * 60; //1 week
    //var projects = self.projectsdb();//Projects are initialized from localdb
    var items = self.itemsdb(); //features are initialized from localdb
}

/*** 
$.Cow.Store object
Pouchdb access
***/

$.Cow.Store = function(core, options){
    var self = this;
    this.core = core;
    this.dbname = options.dbname;
};


/***
$.Cow.ItemStore
***/
$.Cow.ItemStore = function(core, options) {
    var self = this;
    this.loaded = false;
    this.core = core;
    this.options = options;
    this.events = $({});
    this.uid = this.core.UID;
    this.itemList = [];
    //this.name = this.options.name || "store1";
    //Obs: this.core.bind('sketchcomplete', {widget: self}, self._onSketchComplete);
    //Obs: this.core.bind('afterfeaturemodified', {widget: self}, self._onFeatureModified);
}



/***
$.Cow.GeoLocator
***/
$.Cow.GeoLocator = function(core, options){
    var self = this;
    this.core = core;
    this.options = options;
    this.events = $({});
    this.uid = this.core.UID;
    //We need a timeout to settle the core
    setTimeout(function(){self.getLocation()},2000);
}

$.Cow.Core.prototype = {
    /**
    ##cow.me()
    ###**Description**: returns the peer object representing the client it self
    */    
    me: function(){
        var peer = this.getPeerByUid(this.UID);    
        return peer;
    },
    username: function(name){
        switch(arguments.length) {
        case 0:
            return this._username;
        case 1:
            this._username = name;
            //Set username in page
            //TODO: make this more flexible
            $('#myname').val(name);
            //Change username in my peerobject
            if (this.me()){
                this.me().owner({name:name});
            }
        }
    },
    //TODO: future function, has to be implemented
    location: function(location){
        switch(arguments.length){
            case 0:
                return this._location;
            case 1:
                this._location = location;
        }
    },
    activeproject: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this.activeProject;
        case 1:
             //The activeproject will change. Set all the datastores accordingly
            if (!$.isArray(options)) {
               this.activeProject = options.activeProjectId;
               
               //POUCHDB: set groupdbase and itemdbase
               this.groupsdb({projectid: this.activeProject});
               this.itemsdb({projectid: this.activeProject});
               
               var prevproject = this.getProjectByPeerUid(this.UID);
               if (prevproject) //no prevproject on first logon
                   prevproject.removeMember(this.UID);
               this.project = this.getProjectById(options.activeProjectId);
               this.project.members(this.UID);
              
               
               var publicgroup =  this.project.groups({_id:1,name: 'public'});//Add public group to project
               publicgroup.members(this.UID);//Make me member of public
               if (this.groupsdb){ //add defaults to DB
                   this.groupsdb().bulkLoad_UI(this.project.getGroupsData());//Add public to be sure
               }
               
               //Add groups from POUCHDB (including default we just added)
               this.groupsdb().getRecords().done(function(d){
                       self.project.loadGroupsFromDb(d);
               });
               
               this.itemstore().removeAllItems(); //Clear featurestore
               //TODO: change to POUCHDB
               //this.localdbase().itemsdb();//Fill featurestore with what we have
               this.itemsdb().getRecords().done(function(d){
                       self.itemstore().loadItemsFromDb(d);
               });
               var message = this.project.options;
               message.groups = this.project.getGroupsData();
               this.ws.sendData(message, 'projectInfo');
               this.trigger("projectListChanged", this.UID);
               return this.activeProject;
            }
            else {
                throw('wrong argument number, only one activeProject allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },

     /*
        center is an object containing:
        -position: a position().point
        -view: a view().extent
     */
     center: function (options) {
        var position;
        var view;
        // Get the current position
        if (arguments.length===0) {
            position = this.me().position().point;
            view = this.me().view().extent;
            return {
                position: [position.longitude, position.latitude],
                view: view
            };
        }

        // Zoom to the extent of the box
        if (options.view!==undefined) {
            this.trigger('zoomToExtent',options.view);

        }
        
        // Position is given
        else {
            this.trigger('zoomToPoint',options.position);
        }
    },
/**
##cow.websocket([options])
###**Description**: get/set the websocket of the cow
*/
    websocket: function(options) {
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getWebsocket();
        case 1:
            if (!$.isArray(options)) {
                return this._setWebsocket(options);
            }
            else {
                throw('wrong argument number, only one websocket allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    
    _getWebsocket: function() {
        return this.ws;
    },
    _setWebsocket: function(options) {
        var websocket = new $.Cow.Websocket(this, options);
        this.ws=websocket;
    },

/**
##cow.projects([options])
###**Description**: get/set the projects of the cow

**options** an object of key-value pairs with options to create one or
more projects

>Returns: [project] (array of Cow.project) _or_ false

The `.projects()` method allows us to attach projects to a cow object. It takes
an options object with project options. To add multiple projects, create an array of
projects options objects. If an options object is given, it will return the
resulting project(s). We can also use it to retrieve all projects currently attached
to the cow.

When adding projects, those are returned. 

*/

    projects: function(options) {
    // console.log('projects()');
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getProjects();
        case 1:
            if (!$.isArray(options)) {
                if (options.uid) options._id = options.uid;//POUCHDB translation
                return this._addProject(options);
            }
            else {
                return $.core(options, function(project) {
                    return self._addProject(project);
                })
            }
            break;
        default:
            throw('wrong argument number');
        }      
    },
    _getProjects: function() {
        //haal alleen de projects op uit de lijst waar de status != deleted
        /* SMO obs: 12/8/13
        var projects = [];
        $.each(this.projectList, function(id, project) {
            if (project.active)
                projects.push(project);
        });        */
        return this.projectList;
    },
    _addProject: function(options) {
        if (!options._id || !options.name){
            throw('Missing project parameters '+JSON.stringify(options));
        }
        var project;        
        var existing;
        var i;
        //Remove peer from previous project
        if (this.getProjectByPeerUid(options.peeruid))
            this.getProjectByPeerUid(options.peeruid).removeMember(options.peeruid);
        
        //check if project exists
        $.each(this.projectList, function(id, project) {
                if (options._id == project._id) {
                    i = id;
                    existing = true;
                }
        });
        if (existing){//Project exists, only change params
            if (options.peeruid){
             this.projectList[i].members(options.peeruid); //Update membership of project
            }
            project =this.projectList[i]; 
        }
        else {  //Project is new, create it
            if (options.active == null) //could be inactive from db
                options.active = true;
            project = new $.Cow.Project(this, options);
            if (options.peeruid){
                project.members(options.peeruid);
            }
            this.projectList.push(project); //Add project to list
            if (options.peeruid && options.peeruid == this.UID){
                this.activeproject({activeProjectId:project._id}); //Immediately set this my active project as well
            }
            if (this.projectsdb){ //Add project to DB
                this.projectsdb().addRecord_UI(project.options);
            }
        }
        this.trigger("projectListChanged", self.UID);
        return project;
    },
     loadProjectsFromDb: function(d){
        var self = this;
        $.each(d.rows, function(i,d){
            self.projects(d.doc);
        });
    },
    getProjectById: function(id) {
        var projects = this.projects();
        var project;
        $.each(projects, function(){
            if(this._id == id) {            
                project = this;
            }            
        });
        return project;
    },
    getProjectByPeerUid: function(peeruid){
        var projects = this.projects();
        var result;
        $.each(projects, function(id, project){
            memberList = project.members();
            for (var i=0;i<memberList.length;i++){
                if (memberList[i] == peeruid) {
                    result = project;
                }
            }
        });
        return result;
    },
    
    
    removeProject: function(id) {
        var projects = this.projects();
        var projectGone = id;
        var delProject;
        $.each(projects, function(i){
            if(this._id == projectGone) {            
                this.active = false;
                this.options.active = false; //needed for dbase
                //Overwrite project in dbase with new status
                self.core.projectsdb().updateRecord_UI(this);
                
                self.core.trigger("projectListChanged", self.UID);
            }            
        });
        this.projectList = projects;  
    },


/**
##cow.peers([options])
###**Description**: get/set the peers of the cow

**options** an object of key-value pairs with options to create one or
more peers

>Returns: [peer] (array of Cow.Peer) _or_ false

The `.peers()` method allows us to attach peers to a cow object. It takes
an options object with peer options. To add multiple peers, create an array of
peers options objects. If an options object is given, it will return the
resulting peer(s). We can also use it to retrieve all peers currently attached
to the cow.

When adding peers, those are returned. 

=======
A Peer is on object containing:
-view()
-position()
-owner()
-project()
-uid
-options:
 =cid
 =uid 
 =family
-params
 =viewExtent
 =viewFeature
 =locationPoint
 =locationFeature
 =project
 =owner
*/
    peers: function(options) {
      //  console.log('peers()');
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getPeers();
        case 1:
            if (!$.isArray(options)) {
                return this._addPeer(options);
            }
            else {
                return $.core(options, function(peer) {
                    return self._addPeer(peer);
                })
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getPeers: function() {
        var peers = [];
        $.each(this.peerList, function(id, peer) {
            //SMO: mogelijk nog iets leuks meet peer volgorde ofzo
            peers.push(peer);
        });        
        return peers;
    },
    _addPeer: function(options) {
        var peer = new $.Cow.Peer(this, options);        
        
        if (options.uid != this.UID){
            //TT: Obsolete?
            //var geojson_format = new OpenLayers.Format.GeoJSON();
            //var feature = geojson_format.read(peer.view());
            //peer.params.feature = feature;
            peer.view({"extent":options.extent});
            if (options.position){
                peer.position({"point":options.position});
            }
        }
        this.peerList.push(peer);
        //TODO: enable peer.trigger
        //peer.trigger('addpeer');
        return peer;
    },
    //Return feature collection of peer view extents
    getPeerExtents: function() {
        var collection = {"type":"FeatureCollection","features":[]};
        var myprojectmembers = this.getProjectByPeerUid(this.UID).members();
        $.each(this.peers(), function(){
            if (this.uid != self.core.me().uid 
                && this.view().feature
                && $.inArray(this.uid, myprojectmembers) > -1 
                )
                collection.features.push(this.view().feature);
        });
        return collection;
    },
    //Return feature collection of peer positions
    getPeerPositions: function(){
        var collection = {"type":"FeatureCollection","features":[]};
        var myprojectmembers = this.getProjectByPeerUid(this.UID).members();
        $.each(this.peers(), function(){
            if (this.position().feature
                && $.inArray(this.uid, myprojectmembers) > -1){
                    var feature = this.position().feature; //TODO: adding the owner should happen earlier
                    feature.properties.owner = this.owner().name;
                    collection.features.push(this.position().feature);
                }
        });
        return collection;
    },
    getPeerByUid: function(uid) {
    
        var meuid = uid;
        var peers = this.peers();
        var peer;
        $.each(peers, function(){
            if(this.uid == meuid) {            
                peer = this;
            }            
        });
        
        return peer;
    },
    getPeerByCid: function(cid) {
    
        var mecid = cid;
        var peers = this.peers();
        var peer;
        $.each(peers, function(){
            if(this.options.cid == mecid) {            
                peer = this;
            }            
        });
        
        return peer;
    },
/**
##cow.removePeer(cid)
###**Description**: removes the specific peer from the list of peers
*/
    removePeer: function(cid) {
        //TODO: dit werkt niet, toch doro de hele cid lijst lopen
        var peers = this.peers();
        var peerGone = cid;
        var delPeer;
        var feature;
        var point;
        var geolocation;
        var uid;
        $.each(peers, function(i){
            if(this.options.cid == peerGone) {            
                delPeer = i;
            }            
        });
        if(delPeer >= 0) peers.splice(delPeer,1);
        this.peerList = peers;        
        //TODO: remove peer from d3 layers
        
    },
    removeAllPeers: function() {
        var peers = this.peers();
        $.each(peers, function(i,peer){
            peer = {};
        });
        this.peerList = [];
        //TODO: remove peer from d3 layers
    },
        
    /***
    LOCAL DATABASE
    ***/
    /*Obsolete
    localdbase: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getLocalDbase();
        case 1:
            if (!$.isArray(options)) {
                return this._setLocalDbase(options);
            }
            else {
                throw('only one dbase allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getLocalDbase: function(){
        return this.localDbase;
    },
    _setLocalDbase: function(options){
        var dbase = new $.Cow.LocalDbase(this, options);
        this.localDbase = dbase;
    },
    */
    /***
    POUCH DB stores
    ****/
    
    groupsdb: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this.groupsDb;
        case 1:
            this.groupsDb = new $.Cow.Store(this, {dbname: 'group_' + options.projectid});
            this.groupsDb.init();
            
            var changes = this.groupsDb._db.changes({
              continuous: true,
              include_docs: true,
              onChange: function(change) {
                  /* This would create a loop */
                  //self.groups(change.doc);
                  console.log('DB: Groups changed',change);
              }
            });
            if (options.data){//initial data (sketch project)
                $.each(options.data, function(i,d){
                    self.groupsDb.getRecord(d._id)
                        .fail(function(d1){//Not found so adding
                            self.groupsDb.addRecord_UI(d);
                        })
                        .then(function(d){
                            //Group already in dbase, skipping
                        });
                    
                });
            }
            return this.groupsDb;
            break;
        }
    },
    projectsdb: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this.projectsDb;
        case 1:
            this.projectsDb = new $.Cow.Store(this, {dbname: 'project'});
            this.projectsDb.init();

            var changes = this.projectsDb._db.changes({
              continuous: true,
              include_docs: true,
              onChange: function(change) {
                  /* This would create a loop */
                  //self.projects(change.doc);
                  console.log('DB: Projects changed',change);
              }
            });
            if (options.data){//initial data (sketch project)
                $.each(options.data, function(i,d){
                    self.projectsDb.getRecord(d._id)
                        .fail(function(d1){//Not found so adding
                            self.projectsDb.addRecord_UI(d);
                        })
                        .then(function(d){
                            //Project already in dbase, skipping
                        });
                });
            }
            return this.projectsDb;
            break;
        }
    },
    itemsdb: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this.itemsDb;
        case 1:
            this.itemsDb = new $.Cow.Store(this, {dbname: 'item_' + options.projectid});
            this.itemsDb.init();
            return this.itemsDb;
            break;
        }
    },
    
    
     /***
    GEO LOCATOR
    ***/
    geolocator: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getGeoLocator();
        case 1:
            if (!$.isArray(options)) {
                return this._setGeoLocator(options);
            }
            else {
                throw('only one geolocator allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getGeoLocator: function(){
        return this.geoLocator;
    },
    _setGeoLocator: function(options){
        var locator = new $.Cow.GeoLocator(this, options);
        this.geoLocator = locator;
    },
    /***
    ITEM STORES
    ***/
    itemstore: function(options){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._getItemstore();
        case 1:
            if (!$.isArray(options)) {
                return this._addItemstore(options);
            }
            else {
                throw('only one itemstore allowed');
            }
            break;
        default:
            throw('wrong argument number');
        }
    },
    _getItemstore: function(){
        return this.itemStore;
    },
    _addItemstore: function(options){
        var itemStore = new $.Cow.ItemStore(this, options);        
        this.itemStore = itemStore;
        return itemStore;
    },
    
    
    bind: function(types, data, fn) {
        var self = this;

        // A map of event/handle pairs, wrap each of them
        if(arguments.length===1) {
            var wrapped = {};
            $.each(types, function(type, fn) {
                wrapped[type] = function() {
                    return fn.apply(self, arguments);
                };
            });
            this.events.bind.apply(this.events, [wrapped]);
        }
        else {
            var args = [types];
            // Only callback given, but no data (types, fn), hence
            // `data` is the function
            if(arguments.length===2) {
                fn = data;
            }
            else {
                if (!$.isFunction(fn)) {
                    throw('bind: you might have a typo in the function name');
                }
                // Callback and data given (types, data, fn), hence include
                // the data in the argument list
                args.push(data);
            }

            args.push(function() {
                return fn.apply(self, arguments);
            });

            this.events.bind.apply(this.events, args);
        }

       
        return this;
    },
    trigger: function() {
        // There is no point in using trigger() insted of triggerHandler(), as
        // we don't fire native events
        console.debug('trigger: ' + arguments[0]);
        this.events.triggerHandler.apply(this.events, arguments);
        return this;
    },
    // Basically a trigger that returns the return value of the last listener
    _triggerReturn: function() {
        return this.events.triggerHandler.apply(this.events, arguments);
    },

    destroy: function() {
        this.map.destroy();
        this.element.removeData('cow');
    }
   
};

$.fn.cow = function(options) {
    return this.each(function() {
        var instance = $.data(this, 'cow');
        if (!instance) {
            $.data(this, 'cow', new $.Cow.Core($(this), options));
        }
    });
};

$.fn.cow.defaults = {
    core: function() {
        return {
            websocket: {url: 'wss://localhost:443'},
            itemstore: {},
            //localdbase: {},
            geolocator: {},
            groupsdb: {},
            projectsdb: {},
            itemsdb: {}
        };
    }
};

$.Cow.util = {};
// http://blog.stevenlevithan.com/archives/parseuri (2010-12-18)
// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
// Edited to include the colon in the protocol, just like it is
// with window.location.protocol
$.Cow.util.parseUri = function (str) {
    var o = $.Cow.util.parseUri.options,
        m = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i = 14;

    while (i--) {uri[o.key[i]] = m[i] || "";}

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) {uri[o.q.name][$1] = $2;}
    });

    return uri;
};
$.Cow.util.parseUri.options = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user",
            "password", "host", "port", "relative", "path", "directory",
            "file", "query", "anchor"],
    q: {
        name: "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+:))?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+:))?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
};
// Checks whether a URL conforms to the same origin policy or not
$.Cow.util.sameOrigin = function(url) {
    var parsed = $.Cow.util.parseUri(url);
    parsed.protocol = parsed.protocol || 'file:';
    parsed.port = parsed.port || "80";

    var current = {
        domain: document.domain,
        port: window.location.port,
        protocol: window.location.protocol
    };
    current.port = current.port || "80";

    return parsed.protocol===current.protocol &&
        parsed.port===current.port &&
        // the current domain is a suffix of the parsed domain
        parsed.host.match(current.domain + '$')!==null;
};
})(jQuery);

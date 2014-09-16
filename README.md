Concurrent Online Workspace
========================

COW is a real time multi-user data sharing library for the browser. 
It uses (secure) websockets to send changes to its peers and indexeddb to store features in the browser for offline usage.

Currently the server is a normal websocket node.js server behind a haproxy which handles the secure bit.

COW works on the following browsers:
* OSX Safari 7
* Chrome 31 +
* Firefox 26 +
* Internet Explorer (IE) 10 +


Setting up a new cow:
-----------
`````javascript
//Create core object
var core = new Cow.core({herdname: 'test'});

//add a default socketserver
cow.socketservers({
 _id: 'default', 
 data: {protocol:'ws',ip:'192.168.25.152', port:8081}
});
cow.socketserver('default');

var connection;
cow.connect().then(function(d){
        connection = d;
}, function(e){
    console.log('Connecting error', e);
});

`````

From here on you are set to work with the workspace according to the API.

API
===
COW is a workspace to concurrently share data with peers over a webscoket. Peers represent the clients who connected to the same websocket. It is build around a core object that binds together the syncStores, records and messaging components.

Schematically, it looks like:
-----------
* core
   * websocket
   * socketserverStore (1)
        * socketservers (2)
   * peerStore (1)
       * peers (2)
   * userStore (1)
       * users (2)
   * projectStore (1)
       * projects (2)
           * groupStore (1)
               * groups (2)
           * itemStore (1)
               * items (2)
               

(1) = Store
(2) = Record


-----------


All the stores share the same basemethods as follows (userStore as example):
`````javascript
    core.users({}) -> adds an empty record, returns record object
    core.users(<string>) -> returns record object with id = <string>
    core.users([<string>]) -> returns array of record objects with matching ids
    core.users()   -> returns array of all record objects
    core.users(<timestamp>) -> returns array of records created before timestamp
    core.userStore() -> returns the userstore object
    core.userStore().syncRecords() -> syncs all records with dirty == true
`````
When adding a new record, it is possible to include data in the object like: cow.users({_id: 1, data: {name: 'myname'}}). The _id parameter is optional. If you don't give it, a new id will be automatically assigned to the record by COW. We recommend to let COW assign the id for you to avoid the risk of having doublings.

Some store's are configured differently:
* peerStore doesn't use local storage (indexeddb) since peers are unique in every session
* stores can have a maximum lifetime for the records. When a record isn't updated for x time then the record is not used anymore. It is still kept in the localstorage however.
* only the itemstores keep a history of delta's. Other stores have disabled that option for the sake of data reduction

All *record objects* behave the same* and as follows (user object as example):
`````javascript
    user.id() -> returns the id of the record
    user.created() -> returns the timestamp of creation
    user.dirty() -> returns the dirtystatus of the record
    user.dirty(boolean) -> sets the dirtystatus of the record, returns record
    user.deleted() -> returns a boolean (true, false) indicating wether the record has been deleted
    user.deleted(boolean) -> sets the record to deleted, returns record
    user.updated() -> returns the timestamp (last edit) of the record
    user.updated(<timestamp>) -> sets the timestamp of the record, returns record
    user.data() -> returns the data (object) of the record
    user.data(<timestamp>) -> get the data (object) as it was at a specific time
    user.data('key') -> returns the data->key (value) of the record
    user.data('key', 'value') -> sets a key value pair of the data, returns the record
    user.data({object}) -> sets the data of the record, overrides old data, returns the record
        user.sync() -> syncs the record with the database and with the websocket
    
`````
**core specific:**
`````javascript
    core.peer() -> returns our own peer object
    core.peerid()    -> returns our own peerid
    core.peerid(<string>) -> sets our own peerd
    core.user() -> returns the user object of currently logged on user (false when no user logged on)
    core.user(<string>) -> sets the current users id to the core and to the current peer, returns user object
    core.socketserver() -> returns the current socketserver configuration in use
    core.socketserver(<string>) -> sets the current socketserver
    core.websocket() -> returns the websocket object
    core.connect() -> start websocket connection, returns promise
    core.disconnect() -> closes the websocket connection (auto reconnect in 5 secs)
    core.location() -> returns location object of current peer
    core.location(obj) -> set location object of current peer, returns locations object
    core.activeUsers() -> returns array with userobjects that are currently active
    
`````
Since most methods return their own object, the methods are chainable. So you can write rather condensed code:
`````javascript
    var defaultproject = core.projects({}).data('name',"Sketch").sync();
    var defaultgroup = defaultproject.groups({}).data('name','Public').sync();
    var firstitem = defaultproject.items({})
        .data('type','msg')
        .data('creator',core.user().id())
        .sync();
`````
The timestamp and dirtystatus are automatically updated when invoking the data(<whatever>) or deleted(true/false) method so you don't need to worry about that.


#### Core
`````javascript
var cow = new Cow.core({
    herdname: 'test', //name of organisation
    maxage: 1000 * 60 * 60 * 24 * 30 //30 days in milliseconds
});

`````
**description** initialise Cow and associate it with the matched element. The Cow object is refered to as *cow* in the documentation

[options]: 
    herdname (name of the organisation, this will create a separate database, defaults to 'cow')
    maxage (maximum lifetime of objects to be stored, defaults to null)
 
* peerid() -- get peerid
* peerid(id) -- set peerid
* project() -- get current project object
* project(id) -- set current project based on id from projectStore
* user() - get current user object
* user(id) - set current user based on id from userStore
* peer() - return my peer object
* socketserver() - get the current socketserver configuration
* location() - get the last known location
* location(location) - set the current location
* projectStore() - returns the _projectstore object
* projects() - returns array of all projects
* projects(id) - returns project with id (or null)
* projects({config}) - creates and returns project
* socketserverStore() - returns the _socketserverstore object
* socketservers() - returns array of all socketservers
* socketservers(id) - returns socketserver with id (or null)
* socketservers({config}) - creates and returns socketserver object
* peerStore() - returns the _peerstore object
* peers() - returns array of all peers
* peers(id) - returns peer with id (or null)
* peers({config}) - creates and returns peer
* userStore() - returns the _userstore object
* users() - returns array of all users
* users(id) - returns user with id (or null)
* users({config}) - creates and returns user
* activeUsers() - returns array with userobjects that are currently active
* websocket() - return the _websocket object


#### Project
>cow.Project(core, [options])

**description** The Project object. It is constructed with the project options object in cow.projects([options]). The Project object is refered to as *project* in the documentation. A Project has a group of zero or more Peers which share items, allowing for collaborative map-editing. There is one special Project, the 'sketch' project, the default, non-removable project; this one deletes features older than a week to prevent cluttering. 

core: the cow object
creating a project: core.projects(newid)

* groupStore() - return groupStore object
* groups() - return array of group objects
* groups(id) - returns group with id
* groups({options}) - creates and returns group object
* itemStore() - return itemStore object
* items() - return array of item objects
* items(id) - returns item with id
* items({options}) - creates and returns item object
* myGroups() - return the group objects that I am member of

#### Group
* members() - return array of member ids
* members(id) - add id to member array, return group object
* members([id]) - add id's to member array, return group object
* removeMember(id) - remove id from array of member id's, return group object
* removeAllMembers() - empty

#### Item
* permissions() will return an array with all permissions set on this item
* permissions('type') will return an array with the permission of type 'type'
* permissions('type',group) will add the group to the permissions 
*     of type 'type' (and create permission of type 'type' if needed), returns item
* permissions('type',[group]) will add the array of groups to the permissions 
    of type 'type' (and create permission of type 'type' if needed), returns item
* permissionsHasGroup(type <string>,group <string>) - function to check if a particular type contains a particular group. Returns true if it is the case, false in all other cases
* hasPermission(<string>) - check to see if current user has <string> permission on item
* removePermission('type') removes the entire permission type from the item
* removePermission('type',[groups]) removes the groups from the permission type

### Socketserver
>cow.socketserver()

**description** The socketserver obejct. It is constructed with the socketserver options object in cow.socketservers([options]). The socketserver object is refered to as *socketserver* in the documentation. A socketserver contains the configuration on all known websocket servers.

core: the cow object

* url() - return the url to the socketserver, built up from the data elements: protocol, ip, port and directory


#### Peer
>cow.peer(core, [options])

**description** The Peer object. It is constructed with the peer options object in cow.peers([options]). The Peer object is refered to as *peer* in the documentation. A Peer is another cow connected to the same websocket server (this can be someone else or the same user, using a different browser)

core: the cow object

* user() - return id of currently connected user
* user(id) - sets id of currently connected user, returns peer object


#### Websocket
>cow.websocket(core, [options])

**description** The Websocket object. It is constructed with the websocket options object in cow.websocket([options]). The Websocket object is refered to as *ws* in the documentation. The Websocket object contains all the relevant info to make a websocket connection and manages the actual connection.

core: the cow object
[options]: wsUrl

* disconnect() - disconnect us from websocket server
* connect(url) - connect to websocket server on url, returns connection
* connection() - returns connection object
* sendData(data, action, target) - send data to websocket server with params:
            data - json object
            action - string that describes the context of the message
            target - (optional) id of the target peer

Messaging
===
COW makes use of websocket messages to communicate with peers. A peer is not necessarely a COW instance but can be any client that adheres to websocket standards and the COW messaging protocol.
See  <a href='./docs/messaging.md'>messaging.md</a> and <a href='./docs/messaging_shema.png'>schema</a> in docs for an overview of the message flow.

Dependencies Core
=================

### Underscore 1.6 ###
http://underscorejs.org/underscore-min.js

### polyfill-promise ###
https://github.com/jakearchibald/es6-promise

### DB.js ###
https://github.com/aaronpowell/db.js/releases/tag/0.9.0


Dependencies Server
===================

### TODO ###



Known Issues
============



LICENSE
=======

cow is licensed under the MIT license

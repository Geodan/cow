Concurrent Online WebGIS
========================

COW is a real time multi-user geo-editing application for the browser. The application is based on OpenLayers and jQuery. It uses secure websockets to send changes to its peers and indexeddb to store features in the browser for offline usage.

Currently the server is a normal websocket node.js server behind a haproxy which handles the secure bit.

The core has been tested with jQuery versions 1.8.2 and 1.9.1. The demo client has been tested with jQuery-UI versions 1.9.1 & 1.10.2

API
===
Cow is a plugin for jQuery to use websockets to work together with geographical data. Peers represent the people who connected to the same websocket. Peers share their physical location (if available) and their current viewextent of the map. Peers are member of a project and members of the same project share features. 

#### Core
>$(selector).cow([options])

**description** initialise Cow and associate it with the matched element. The Cow object is refered to as *cow* in the documentation

[options]: wsUrl (url to the websocket server 
 
* peerid() -- get peerid
* peerid(id) -- set peerid
* project() -- get current project object
* project(id) -- set current project based on id from projectStore
* user() - get current user object
* user(id) - set current user based on id from userStore
* peer() - return my peer object
* location() - get the last known location
* location(location) - set the current location
* projectStore() - returns the _projectstore object
* projects() - returns array of all projects
* projects(id) - returns project with id (or null)
* projects({config}) - creates and returns project
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
 TODO

#### Item
 TODO

#### Peer
>cow.Peer(core, [options])

**description** The Peer object. It is constructed with the peer options object in cow.peers([options]). The Peer object is refered to as *peer* in the documentation. A Peer is another cow connected to the same websocket server (this can be someone else or the same user, using a different browser)

core: the cow object

* user() - return id of currently connected user
* user(id) - sets id of currently connected user, returns peer object


#### Websocket
>cow.Websocket(core, [options])

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
See the <a href='./docs/messaging.md'>image</a> and <a href='./docs/messaging_shema.png'>image</a> in docs for an overview of the message flow.



Dependencies Core
=================

### jQuery ###
jQuery version 1.10.2

### OpenLayers ###
OpenLayers version 2.12

### jquery.indexeddb.js ###
https://github.com/axemclion/jquery-indexeddb

### D3js ###
D3js version 3


Dependencies Client
===================

### jQuery-UI ###
jQuery-UI version 1.10.2


Known Issues
============



LICENSE
=======

cow is licensed under the MIT license

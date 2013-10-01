Concurrent Online WebGIS
========================

COW is a real time multi-user geo-editing application for the browser. The application is based on OpenLayers and jQuery. It uses secure websockets to send changes to its peers and indexeddb to store features in the browser for offline usage.

Currently the server is a normal websocket node.js server behind a haproxy which handles the secure bit.

The core has been tested with jQuery versions 1.8.2 and 1.9.1. The demo client has been tested with jQuery-UI versions 1.9.1 & 1.10.2

API
===
Cow is a plugin for jQuery to use websockets to work together with geographical data. Peers represent the people who connected to the same websocket. Peers share their physical location (if available) and their current viewextent of the map. Peers are member of an herd and members of the same herd can share features. 

#### Core
>$(selector).cow([options])

**description** initialise Cow and associate it with the matched element. The Cow object is refered to as *cow* in the documentation

[options]: websocket (object with url to the websocket server ) - default: wss://localhost:443 
 
* me()
* activeherd([options])
* username(string)
* center([options])
* herds([options])
 * getHerdById(id)
 * getHerdByPeerUid(peeruid)
 * removeHerd(id)
* peers([options])
 * getPeerExtents()
 * getPeerPositions()
 * getPeerByUid(uid)
 * getPeerByCid(cid)
 * removePeer(cid)
 * removeAllPeers()
* featurestore([options])
* localdbase([options])
* websocket([options])
* geolocator([options])
* bind()
* trigger()

#### Herd
>cow.Herd(core, [options])

**description** The Herd object. It is constructed with the herd options object in cow.herds([options]). The Herd object is refered to as *herd* in the documentation. An Herd is a group of zero or more Peers which share features, allowing for collaborative map-editing. There is one special Herd, the 'sketch' herd, the default, non-removable herd; this one deletes features older than a week to prevent cluttering. 

core: the cow object

[options]: { uid : int, name : string [,active: boolean] [,members: [peeruids]] }
 
* members(peerid)
* removeMember(peerid)
* removeAllMembers()
* bind()
* trigger()

#### Peer
>cow.Peer(core, [options])

**description** The Peer object. It is constructed with the peer options object in cow.peers([options]). The Peer object is refered to as *peer* in the documentation. A Peer is another cow connected to the same websocket server (this can be someone else or the same user, using a different browser)

core: the cow object

[options]: { uid : int, cid: int ,extent: {bottom: float, left: float, top: float, right: float}, [position: {latitude: float, longitude: float, time: timestamp}]  }
 
* view([options])
* position([options])
* owner([options])
* video([options])
* bind()
* trigger()

#### Websocket
>cow.Websocket(core, [options])

**description** The Websocket object. It is constructed with the websocket options object in cow.websocket([options]). The Websocket object is refered to as *ws* in the documentation. The Websocket object contains all the relevant info to make a websocket connection and manages the actual connection.

core: the cow object

[options]: {url: string}

* sendData(data, action, [target])
* openws(url)
* closews()
* bind()
* trigger()

#### FeatureStore
>cow.FeatureStore(core, [options])

**description** The FeatureStore object. It is constructed with the featurestore options object in cow.featurestore([options]). The FeatureStore object is refered to as *fs* in the documentation. The fs keeps all features in the active herd in memory and syncs those with peers, the db and the map

core: the cow object

[options]: none available

* featureitems([options],[source])
* syncFids([fids])

#### LocalDbase
>cow.LocalDbase(core, [options])

**description** The LocalDbase object. It is constructed with the localdbase options object in cow.localdbase([options]). The localdbase object is refered to as *db* in the documentation. The db stores the uid, name and state of all known herds of cow in a persistent database using indexeddb. It also stores all features per herd in persistent databases using indexeddb. Only the features of active herds get synced with the db.

core: the cow object

[options]: {dbname : string } (not yet working)

* herdsdb([options])
* featuresdb([options])
* removeherd(herdId)
* removefeature(featureId)

#### GeoLocator
>cow.GeoLocator(core, [options])

**description** The GeoLocator object. It is constructed with the geolocator options object in cow.geolocator([options]). The geolocator object is refered to as *geolocator* in the documentation. The geolocator manages the retrieval of the real world location of cow, if available

core: the cow object

[options]: none available

* getLocation()


Messenging
===
COW makes use of websocket messages to comminicate with peers. A peer is not necesseraly a COW instance but can be any client that adheres to websocket standards and the COW messaging protocol.


#### connected
>{"action":"connected","payload":{"cid":0}} 

webscocket confirms connection by returning a CID

#### peerGone
>{"action":"peerGone","payload":{"peerCid":0,"newCid":0}} 

the server noticed a peer disconnecting and send its connection-id to the pool

##### Messages from Peers: targeted messages
#### informPeer
>{"uid":1380616779556,"target":1380616903327,"action":"informPeer","payload":{"options":{"uid":1380616779556,"cid":0,"family":"alpha"},"view":{"left":4.8860368751853,"bottom":52.335417998001,"right":4.9347028755515,"top":52.351568353647},"owner":{"name":"TomFF"},"position":{"coords":{"longitude":4.9128983,"latitude":52.3424068},"time":1380616803963},"video":{"state":"off"}}} 

the client has joined and receives the status from peers: connection-id, uid, extent

#### syncPeer
>{"uid":1380616779556,"target":1380616903327,"action":"syncPeer","payload":{"requestlist":[],"pushlist":[],"storename":666}} 
the alpha peer sends a sync message with new features and a feature request

#### requestedFeats
>{"uid":1380617321116,"action":"requestedFeats","payload":{"features":[{"key":"1380617321116#1380617339537","uid":1380617321116,"created":1380617339537,"updated":1380617339537,"status":"","feature":{"type":"Feature","properties":{"icon":"./mapicons/imoov/s0880_B06---g.png","key":"1380617321116#1380617339537","store":666,"creator":"TomFF","owner":"TomFF"},"geometry":{"type":"Point","coordinates":[4.913888933595962,52.343493913247165]}}}],"storename":666}}
requested feats are returning from peer


##### Messages from Peers: broadcasted messages
#### updatePeers
>{"uid":1380616903327,"action":"updatePeers","payload":{"uid":1380616903327,"connectionID":0}}
a peer is gone and everybody has a new connection-id, recieve a connectionID with UID

#### newPeer
>{"uid":1380616170654,"action":"newPeer","payload":{"uid":1380616170654,"cid":0,"family":"alpha"}}
a new peer just joined, recieve its status: connection-id, uid, extent

#### newPeerFidList
>{"uid":1380616170654,"action":"newPeerFidList","payload":{"fids":[],"storename":666}} 
a new peer just sent it's fidlist

#### peerUpdated
>{"uid":1380616170654,"action":"peerUpdated","payload":{"video":{"state":"off"}}} 
>{"uid":1380616170654,"action":"peerUpdated","payload":{"owner":{"name":"Tom"}}} 
>{"uid":1380616170654,"action":"peerUpdated","payload":{"extent":{"bottom":0,"left":0,"top":1,"right":1}}}
>{"uid":1380616170654,"action":"peerUpdated","payload":{"point":{"coords":{"longitude":4.9128983,"latitude":52.3424068},"time":1380616176418}}} 
a peer has changed, update the peer

#### newFeature
>{"uid":1380616779556,"action":"newFeature","payload":"{\"options\":{\"key\":\"1380616779556#1380616812275\",\"uid\":1380616779556,\"created\":1380616812275,\"updated\":1380616812275,\"status\":\"\",\"feature\":{\"type\":\"Feature\",\"properties\":{\"icon\":\"./mapicons/imoov/s0400---g.png\",\"key\":\"1380616779556#1380616812275\",\"store\":666,\"creator\":\"TomFF\",\"owner\":\"TomFF\"},\"geometry\":{\"type\":\"Point\",\"coordinates\":[4.911271097597397,52.344306667178856]}}}}"} 
a new object was drawn or updated by a peer

#### updateFeature
>

#### getHerdInfo
>
A peer request information about a herd

#### herdInfo
>{"uid":1380616170654,"action":"herdInfo","payload":{"uid":666,"name":"sketch","peeruid":1380616170654,"active":true}} 
Info about a herd comes in...


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

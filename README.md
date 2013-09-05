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

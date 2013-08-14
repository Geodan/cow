Concurrent Online WebGIS
========================

COW is a real time multi-user geo-editing application for the browser. The application is based on OpenLayers and jQuery. It uses secure websockets to send changes to its peers and indexeddb to store features in the browser for offline usage.

Currently the server is a normal websocket node.js server behind a haproxy which handles the secure bit.

The core has been tested with jQuery versions 1.8.2 and 1.9.1. The demo client has been tested with jQuery-UI versions 1.9.1 & 1.10.2

API
===
Cow is a plugin for jQuery to use websockets to work together with geographical data. Peers represent the people who connected to the same websocket. Peers share their physical location (if available) and their current viewextent of the map. Peers are member of an herd and members of the same herd can share features. 

### Core
>$(selector).cow([options])

**description** initialise Cow and associate it with the matched element. The Cow object is refered to as *cow* in the documentation

*options*: an object of key-value pairs with options for cow.
 * websocket (object with url to the websocket server ) - default: wss://localhost:443 
 
#### me()
>cow.me()

**description** shorthand to get the Peer object representing the local peer; the one controlled by the local user

**returns:** me (Cow.Peer)

#### activeherd()
>cow.activeherd([options])

**description** gets or sets the 'Active Herd' of the client, this is the herd the user is currently working in.

*options*: an object of key-value pairs with options for activeHerd
 * activeHerdId (int with the UID of the active herd)
 
**returns:** id (int)
 
#### center()
>cow.center([options])

**description** gets the postion of the user and the viewextent of the map or set zooms the map to the given viewextent or position

*options*: an object of key-value pairs with options for center
 * position (an object containing latitude and longitude floats)
 * view (an object containing left, bottom, right and top floats)
 
**returns:** {position: [longitude, latitude], view: {left:float, bottom: float, right: float, top: float }}

#### herds()
#### peers()
#### featurestore()
#### localdbase()
#### websocket()
#### geolocator()
#### bind()
#### trigger()

### Herd
#### members()
#### removeMember()
#### removeAllMembers()
#### bind()
#### trigger()

### Peer
#### view()
#### position()
#### owner()
#### video()
#### bind()
#### trigger()

### Websocket
#### sendData()
#### openws()
#### closews()
#### bind()
#### trigger()

### FeatureStore
#### featureitems()
#### syncFids()

### LocalDbase
#### herdsdb()
#### featuresdb()
#### removeherd()
#### removefeature()

### GeoLocator
#### getLocation()


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

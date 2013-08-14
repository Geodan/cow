Concurrent Online WebGIS
========================

COW is a real time multi-user geo-editing application for the browser. The application is based on OpenLayers and jQuery. It uses secure websockets to send changes to its peers and indexeddb to store features in the browser for offline usage.

Currently the server is a normal websocket node.js server behind a haproxy which handles the secure bit.

The core has been tested with jQuery versions 1.8.2 and 1.9.1. The demo client has been tested with jQuery-UI versions 1.9.1 & 1.10.2

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

API
===
Cow is a plugin for jQuery to use websockets to work together with geographical data. Peers represent the people who connected to the same websocket. Peers share their physical location (if available) and their current viewextent of the map. Peers are member of an herd and members of the same herd can share features. 

### Core
$(selector).cow([options])
*description* initialise Cow and associate it with the matched element
options: an object of key-value pairs with options for cow.
possible pairs are:
 * websocket (object with url to the websocket server ) - default: wss://localhost:443 
 
#### me()

#### center()
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


Known Issues
============



LICENSE
=======

cow is licensed under the MIT license

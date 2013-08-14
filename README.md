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
### Core
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

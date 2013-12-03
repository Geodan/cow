window.Cow = window.Cow || {};
//TODO: complete rewrite from cow.websocket.js and core.js
Cow.websocket = function(config){
    this._url = config.wsUrl;
    //socket connection object
    this._connection = {};
};

Cow.websocket.prototype = {
    
    connect: function(URL){},
    disconnect: function(){},
    sendData: function(data, action, target){},
    _onMessage: function(message){},
    _onClose: function(e){},
    _onConnect: function(d){},
    _onError: function(e){}
    //... follows a whole set of internal functions that handle the COW message protocol
    // this could be called the 'heart' of the software 
};

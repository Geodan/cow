(function(){

var root = this;
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Cow || {};
    }
    exports.Cow = Cow || {}; 
} else {
    if (typeof(Cow) == 'undefined') {
        root.Cow = {};
    }
    else {
        root.Cow = Cow;
    }
}

Cow.websocket = function(config){
    this._core = config.core;
    this._url = config.url;
    this._connection = null;
    this._connected = false;
};

    /**
        disconnect() - disconnect us from websocket server
    **/
Cow.websocket.prototype.disconnect = function() {
    if (this._connection){
        this._connection.close();    
        this._connection = null;
        this._connected = false;
    }
    else { 
        console.log('No websocket active');
    }
};

    /**
        connect(url) - connect to websocket server on url, returns connection
    **/
Cow.websocket.prototype.connect = function() {
    var self = this;
    var core = this._core;
    var promise = new Promise(function(resolve, reject){
        if (core.socketserver()){
            self._url = core.socketserver().url(); //get url from list of socketservers
        }
        else {
            console.warn('No valid socketserver selected');
            self._url = null;
        }
        
        if (!self._url) {
            console.warn('Nu URL given to connect to. Make sure you give a valid socketserver id as connect(id)');
            reject();
        }
        
        var connectpromise;
        if (!self._connection || self._connection.readyState != 1 || self._connection.state != 'open') //if no connection
        {
            if(self._url.indexOf('ws') === 0) {
                var connection = null;
                //In case of nodejs....
                connection = new WebSocket(self._url, 'connect');
                connection.onopen = self._onOpen;
                connection.onmessage = self._onMessage;
                connection.onclose = self._onClose;    
                connection.onerror = self._onError;
                connection._core = self._core;
                self._connection = connection;
                self._connected = true;//TODO, perhaps better to check if the connection really works
            }
            else {
                console.warn('Incorrect URL: ' + self._url);
                reject();
            }
        }
        else {
            connection = self._connection;
        }
        resolve(connection);
    });
    return promise;
};
    /**
        connection() - returns connection object
    **/
Cow.websocket.prototype.connection = function(){
    return this._connection;
};

Cow.websocket.prototype.send = function(message){
    if (this._connection && (this._connection.readyState == 1 || this._connection.state == 'open')){
        this._connection.send(message);
    }
};
Cow.websocket.prototype._onOpen = function(){
	this._core.websocket().trigger('connected');
};

Cow.websocket.prototype._onMessage = function(message){
    this._core.websocket().trigger('message',message);
};

Cow.websocket.prototype._onError = function(e){
    this._core.peerStore().clear();
    this._connected = false;
    console.warn('error in websocket connection: ' + e.type);
    this._core.websocket().trigger('error',e);
};

Cow.websocket.prototype._onClose = function(event){
    this._core.websocket().trigger('closed',event);
    var code = event.code;
    var reason = event.reason;
    var wasClean = event.wasClean;
    
    console.log('WS disconnected:' , code, reason);
    this._core.peerStore().clear();
    this._connected = false;
    var self = this;
    var restart = function(){
        try{
            console.log('Trying to reconnect');
            self._core.websocket().disconnect();
        }
        catch(err){
            console.warn(err);
        }
        self._core.websocket().connect().then(function(d){
           self._connection = d;
        }, function(e){
            console.warn('connection failed',e);
        });
    };
    if (this._core._autoReconnect){
    	window.setTimeout(restart,5000);
    }
};

_.extend(Cow.websocket.prototype, Events);
}.call(this));
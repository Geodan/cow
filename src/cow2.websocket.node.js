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
            self._url = null;
            reject('No valid socketserver selected');
        }
        
        if (!self._url) {
            reject('No URL given to connect to. Make sure you give a valid socketserver id as connect(id)');
        }
    
        if (!self._connection || self._connection.readyState != 1 || self._connection.state != 'open') //if no connection
        {
            if(self._url.indexOf('ws') === 0) {
                var connection = null;
                connection = new WebSocket();
                connection.on('connectFailed', function(error) {
                    reject('Connect Error: ' + error.toString());
                });
                connection.on('connect', function(conn) {
                    conn.on('error', self._onError);
                    conn.on('message', function(message) {
                        if (message.type === 'utf8') {
                            //console.log("Received: '" + message.utf8Data + "'");
                            self._onMessage({data:message.utf8Data});
                        }
                    });
                    conn.obj = self;
                    self._connection = conn;
                    resolve(self._connection);
                });
                //TODO: there is some issue with the websocket module,ssl and certificates
                //This param should be added: {rejectUnauthorized: false}
                //according to: http://stackoverflow.com/questions/18461979/node-js-error-with-ssl-unable-to-verify-leaf-signature#20408031
                connection.connect(self._url, 'connect');
                
            }
            else {
                reject('Incorrect URL: ' + self._url);
            }
        }
        else {
            connection = self._connection;
            resolve(self._connection);
        }
        
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

Cow.websocket.prototype._onMessage = function(message){
    this._core.websocket().trigger('message',message);
};

Cow.websocket.prototype._onError = function(e){
    this._core.peerStore().clear();
    this._connected = false;
    this._core.websocket().trigger('error','error in websocket connection: ' + e.type);
};
Cow.websocket.prototype._onError = function(e){
    this._core.websocket().trigger('notice','socket error' + e);
};
Cow.websocket.prototype._onClose = function(event){
	this._core.websocket().trigger('notice','socket closed');
};
_.extend(Cow.websocket.prototype, Events);
}.call(this));
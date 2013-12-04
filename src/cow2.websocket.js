window.Cow = window.Cow || {};
//TODO: complete rewrite from cow.websocket.js and core.js
Cow.websocket = function(config){
    this._core = config.core;
    //socket connection object
    this._connection = null;
    this._url = config.url;
    this.connection = this.connect(this._url);
};

Cow.websocket.prototype = {
    disconnect: function() {
        if (this._connection){
            this._connection.close();    
            this._connection = null;
        }
        else { 
            throw('No websocket active');
        }
    },
    connect: function(url) {
        var core = this.core;
        if (!this._connection || this._connection.readyState != 1) //if no connection
        {
            if(url.indexOf('ws') === 0) {
                var connection = new WebSocket(this._url, 'connect');
                connection.onopen=this._onOpen;
                connection.onmessage = this._onMessage;
                connection.onclose = this._onClose;    
                connection.onerror = this._onError;
                connection.obj = this; //TT: Why is this?
            }
            else {throw('Incorrect URL: ' + url);}
        }
        else {
            connection = this._connection;
        }
        return connection;
    },
    connection: function(){
        return this._connection;
    },    
    sendData: function(data, action, target){
        //TODO
        console.log('COW2 sendData: ', data);
    },
    _onMessage: function(message){
        console.log('COW2 :',message.data);
        //TODO
    },
    _onClose: function(e){
        //TODO
    },
    _onConnect: function(d){
        //TODO
    },
    _onError: function(e){
        //TODO
    }
    //... follows a whole set of internal functions that handle the COW message protocol
    // this could be called the 'heart' of the software 
};

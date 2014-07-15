window.Cow = window.Cow || {};
Cow.socketserver = function(config){
     if (!config._id) {throw 'No _id given for socketserver';}
    this._id = config._id;
    this._store = config.store;
    this._core = this._store._core;
    this._data = {
        serverurl: null
    };
    
    //FIXME: this might be inherited from cow.record 
    this._status= 'dirty';
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};

Cow.socketserver.prototype = { 
        
            
};
_.extend(Cow.socketserver.prototype,Cow.record.prototype);

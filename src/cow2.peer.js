window.Cow = window.Cow || {};
Cow.peer = function(config){
     if (!config._id) {throw 'No _id given for peer';}
    this._id = config._id;
    this._store = config.store;
    this._data = {
        userid:null, 
        family: 'alpha' //default is alpha
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

Cow.peer.prototype = { 
        //__proto__: Cow.record.prototype,
        /**
            user() - return id of currently connected user
            user(id) - sets id of currently connected user, returns peer object
        **/
        user: function(id){
            if (id) {
                return this.data('userid',id);
            }
            return this.data('userid');
        }
};
_.extend(Cow.peer.prototype,Cow.record.prototype);

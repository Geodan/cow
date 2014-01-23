window.Cow = window.Cow || {};
Cow.peer = function(config){
     if (!config._id) {throw 'No _id given for peer';}
    this._id = config._id;
    this._store = config.store;
    this._data = {
        userid:null, 
        family: 'alpha' //default is alpha
    };
};

Cow.peer.prototype = {
        __proto__: Cow.record.prototype,
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

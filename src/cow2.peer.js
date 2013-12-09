window.Cow = window.Cow || {};
Cow.peer = function(config){
     if (!config._id) {throw 'No _id given for peer';}
    this._id = config._id;
    this._store = config.store;
    this._data = {userid:null};
};

Cow.peer.prototype = {
        __proto__: Cow.record.prototype,
        getUserId: function(){
            return this._data.userid;
        }
};

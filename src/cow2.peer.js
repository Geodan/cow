window.Cow = window.Cow || {};
Cow.peer = function(config){
     if (!config._id) {throw 'No _id given for peer';}
    this._id = config._id;
};

Cow.peer.prototype = {
        __proto__: Cow.record.prototype
};

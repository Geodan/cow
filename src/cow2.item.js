window.Cow = window.Cow || {};
Cow.item = function(config){
    if (!config || !config._id) {throw 'No _id given for item';}
    this._id = config._id;
    this._store = config.store;
};
Cow.item.prototype = 
{
    __proto__: Cow.record.prototype
    
};
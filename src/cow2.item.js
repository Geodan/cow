window.Cow = window.Cow || {};
Cow.item = function(config){
    if (!config || !config._id) {throw 'No _id given for user';}
    this._id = config._id;
};
Cow.item.prototype = 
{
    __proto__: Cow.record.prototype
    
};

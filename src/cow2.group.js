window.Cow = window.Cow || {};
Cow.group = function(config){
    if (!config._id) {throw 'No _id given for group';}
    this._id = config._id;
};
Cow.group.prototype = 
{
    __proto__: Cow.record.prototype
    
};

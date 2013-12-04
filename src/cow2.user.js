window.Cow = window.Cow || {};
Cow.user = function(config){
    if (!config._id) {throw 'No _id given for user';}
    this._id = config._id;
};
Cow.user.prototype = 
{
    __proto__: Cow.record.prototype,
    getName: function(){
        return this.data('mail');
    },
    getMail: function(){
        return this.data('mail');
    }
};

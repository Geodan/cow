window.Cow = window.Cow || {};
Cow.user = function(){};
Cow.user.prototype = 
{
    __proto__: Cow.record.prototype,
    _name: null,
    _mail: null,
    
    getName: function(){
        return this.data('mail');
    },
    getMail: function(){
        return this.data('mail');
    }
};

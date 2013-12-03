window.Cow = window.Cow || {};
Cow.user = function(){

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

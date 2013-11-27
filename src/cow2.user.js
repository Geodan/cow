Cow.user = function(){};
Cow.user.prototype = 
{
    _id: null,
    _name: null,
    _mail: null,
    getName: function(){
        return _name;
    },
    getMail: function(){
        return _mail;
    },
    deflate: function(){
        return {_id: _id, name: _name, mail: _mail}; 
    },
    inflate: function(config){
        _id = config._id;
        _name = config.name;
        _mail = config.mail;
    }
};

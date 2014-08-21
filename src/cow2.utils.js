var Cow = {};
(function(){

var root = this;
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Cow || {};
    }
    exports.Cow = Cow || {}; 
} else {
    root.Cow = Cow || {};
}

Cow.utils = {
    //Generate a unique id
    idgen: function(){
        //TODO: add some randomness
        return new Date().getTime().toString();
    }
};
}.call(this));
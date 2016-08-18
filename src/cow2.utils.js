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
    root._ = _;
}

Cow.utils = {
    //Generate a unique id
    idgen: function(){
        return 'ID'+(Math.random() * 1e16).toString();
    }
};
}.call(this));
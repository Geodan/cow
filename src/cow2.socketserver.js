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

Cow.socketserver = function(config){
    this._id = config._id  || Cow.utils.idgen();;
    this._store = config.store;
    this._core = this._store._core;
    this._maxAge = this._core._maxAge;
    
    //FIXME: this might be inherited from cow.record 
    this._dirty= true;
    this._ttl = this._store._maxAge;
    this._deleted= false;
    this._created= new Date().getTime();
    this._updated= new Date().getTime();
    this._data = {
        protocol: null,
        ip: null,
        port: null,
        dir: null
    };
    this._deltaq = {}; //delta values to be synced
    this._deltas = []; //all deltas
    this._deltasforupload = []; //deltas we still need to give to other peers
    //END OF FIXME
    
};

Cow.socketserver.prototype = { 
        url: function(){
            var protocol = this.data('protocol');
            var ip = this.data('ip');
            var port = this.data('port');
            var dir = this.data('dir') || '' ;
            return protocol + '://' + ip + ':' + port + '/' + dir;  
        }
};
_.extend(Cow.socketserver.prototype,Cow.record.prototype);
}.call(this));
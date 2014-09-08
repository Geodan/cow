window.Cow = window.Cow || {};

Cow.data = function(core){
    this.core = core;
    return this;
};

Cow.data.prototype = 
{
    _returner: function(data){
        return _.sortBy(
                _.filter(data,  
                    function(d){return !d.deleted();}), 
            function(d){return d.updated();});
    },
    
    users: function(){
        return this._returner(this.core.users());
    },

    peers: function(){
        return this._returner(this.core.peers());
    },

    projects: function(){
        return this._returner(this.core.projects());
    },
    socketservers: function(){
        return this._returner(this.core.socketservers());
    },

    /**
    Get features from current project
    **/
    features: function(){
        if (!this.core.project()){
            console.warn('No project selected');
            return false;
        }
        return _.filter(
            this.core.project().items(), 
            function(d){
                return (d.data('type') == 'feature' && !d.deleted());
            }
        );
    },

    featureCollection: function(){
        if (!this.core.project()){
            console.warn('No project selected');
            return false;
        }
        var collection = { "type": "FeatureCollection","features": []};
        var feats = this.features();
        feats.forEach(function(d){
                if (d.data('geojson')){
                    collection.features.push(d.data('geojson'));
                }
        });
        return collection;
    }
    
    
};
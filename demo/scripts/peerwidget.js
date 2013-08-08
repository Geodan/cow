/*$.Cow.ConnectWidget = {
init: function(){
var widget = $('#connect');
var cow = $('#cow').data('cow');
cow.events.bind('connected',{}, this._onConnect);
},
_onConnect: function() {
}
}
*/
(function($) {
$.widget("cow.PeersWidget", {
    options: {
        // The cow.core instance
        core: undefined,
        name: '#myname'
    },
 _create: function() {
        var core;
        var self = this;        
        var element = this.element;

        core = $(this.options.core).data('cow');
        this.core=core;
      
        core.bind("ws-peerInfo", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerGone", {widget: self}, self._onPeerStoreChanged);
        core.bind("peerStoreChanged" ,{widget: self}, self._onPeerStoreChanged);
       
        
        element.delegate('.location','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var location = peer.position().point;
            self.core.center({position:location});
        });
        
        element.delegate('.extent','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var bbox = peer.view().extent;
            self.core.center({view:bbox});
        });
        
        //Preliminary peerjs video connection
        element.delegate('.videoconnection','click', function(){
            var owner = $(this).attr('owner');
            $('#videopanel').add("button").on("click",function(e){
                console.log("Closing "  + owner);
                self.peer1.managers[owner].close();
                $('#videopanel').hide();
            });
            
            $('#videopanel').show();
            
            mc = self.peer1.call(owner, ls);
            tmp = self.peer1;
            mc.on('stream', function(s){
                window.remote = s;
                  z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('#videoplace');
              });
            
         });
        
        element.delegate('.herd','click', function(){
            var herd = $(this).attr('herd');
            self.core.activeHerd = herd;
            if (self.core.me())
                self.core.me().herd({uid: herd});
            
            self.core.featurestore().clear(); //Clear featurestore
            //self.core.options.storename = "store_"+herd; //TODO: the link between activeHerd and storename can be better
            self.core.localdbase().loadFromDB();//Fill featurestore with what we have
            
            
        });
        
        $(this.options.name).change(function(){
            self.core.me().owner({"name":$(this).val()});
            
        });

    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
    
    
    _onPeerStoreChanged: function(evt) {
    console.log('_onNewPeer');
        var self = evt.data.widget;
        self._updateList(evt);
    },
    
    _updateList: function(evt) {        
        var self = evt.data.widget;
        var peers = self.core.peers();
        var herds = [];
        var element = self.element;
        
        $.each(self.core.herds(),function(i) {
            herds[i] = {};
            herds[i].uid = this.uid;
            herds[i].name = this.name;
            herds[i].peers = [];
        });
        $.each(peers,function() {
            var id = this.herd().uid;
            herds[id].peers.push(this);
        });
        var names = '';
        $.each(herds,function() {
            if(this.uid==self.core.activeHerd) {
                names = names + '<span class="peerlist herd me" title="this is your herd" herd="'+this.uid+'">'+this.name+'</span></br>';
            }
            else {
                names = names + '<span class="peerlist herd" title="click to activate this herd" herd="'+this.uid+'">'+this.name+'</span></br>';
            }
            $.each(this.peers, function(){
                if(this.uid==self.core.UID) {
                    names = names+ '<span class="peerlist peer me" title="this is you!" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png"></span></br>';
                    }
                    else {
                    names = names+ '<span class="peerlist peer owner" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png">&nbsp;<img class="extent" owner="'+this.uid+'" src="./css/img/extents.png">&nbsp;<img class="videoconnection" owner="'+this.uid+'" src="./css/img/camera.png"></span></br>';
                    }
            });
        });

        names = names + '<input type="text" id="newHerd">';
        
        element.html(names);
        
    }
    });

})(jQuery);



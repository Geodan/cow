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
        core.bind("ws-connected", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-disconnected", {widget: self}, self._onPeerStoreChanged);
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
            self.core.trigger('changeHerdRequest', herd);
            
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
        var herds = self.core.herds();
        var element = self.element;
        
        
        var names = '';
        $.each(peers,function(){
            if(this.uid==self.core.UID) {
            names = names+ '<span class="peerlist me" title="this is you!" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png"></span></br>';
            }
            else {
            names = names+ '<span class="peerlist owner" owner="'+this.uid+'">'+this.owner().name+'&nbsp;<img owner="'+this.uid+'" class="location" src="./css/img/crosshair.png">&nbsp;<img class="extent" owner="'+this.uid+'" src="./css/img/extents.png">&nbsp;<img class="videoconnection" owner="'+this.uid+'" src="./css/img/camera.png"></span></br>';
            }
        });
        names = names + "<h2>Herds</h2>";
        $.each(herds,function(){
            if(this.id==self.core.options.activeHerd) {
                names = names + '<span class="peerlist me" title="this is your herd" herd="'+this.id+'">'+this.name+'</span></br>';
            }
            else {
                names = names + '<span class="peerlist herd" title="click to activate this herd" herd="'+this.id+'">'+this.name+'</span></br>';
            }
        });

        element.html(names);
        
    }
    });

})(jQuery);



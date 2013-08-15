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
       
        this.peer1;
        this.ls;
        
        element.append('<div id="list"></div>');
        element.append('<span><input type="text" id="newHerd" value="Add a new herd" size="15"><span class="addHerd licht">Add</span></span>');
        element.append('<div id="peerjs"></div>');
        this.listdiv = element.find('#list');
        this.peerjsdiv = element.find('#peerjs');
        this.peerjsdiv.html('<br>Camera:' 
                + '<input type="checkBox" id="cameraOnOff">'
                + '<div id="videopanel">'
                + '<h2>Video:</h2><button id="videoclosebtn">Close</button>'
                + '<div id="videoplace"></div>'
                + '</div>');
        
        core = $(this.options.core).data('cow');
        this.core=core;
        this.oldherds = [];
        
        core.bind("ws-disconnected", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerInfo", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerGone", {widget: self}, self._onPeerStoreChanged);
        core.bind("peerStoreChanged" ,{widget: self}, self._onPeerStoreChanged);
        core.bind("herdListChanged" ,{widget: self}, self._onPeerStoreChanged);
        
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
        element.delegate('.removeherd','click', function(){
            $(this).siblings('.removeherdconfirm').removeClass('verborgen');
        });
        element.delegate('.notremove','click', function(){
            $(this).parent().addClass('verborgen');
        });
        element.delegate('#newHerd','click', function(){
            $(this).addClass('newHerdActive');
            var value = $(this).val();
            if(value == "Add a new herd") $(this).val('');
            $(this).siblings('.addHerd').removeClass('licht');
        });
        element.delegate('#newHerd','blur', function(){
            $(this).removeClass('newHerdActive');
            var value = $(this).val();
            if(value == "") $(this).val('Add a new herd');
            $(this).siblings('.addHerd').addClass('licht');
        });
        element.delegate('.yesremove','click', function(){
            var herdID= $(this).parent().siblings('.herd').attr('herd');
            self.core.removeHerd(herdID);
            //$(this).parent().addClass('verborgen');
            
        });
         element.delegate('.addHerd','click', function(){
            var time = new Date().getTime();
            var name = $('#newHerd').val();
            self.core.herds({uid: time,name:name, peeruid: self.core.UID});
            $('#newHerd').val('Add a new herd');
            //$(this).parent().addClass('verborgen');
            
        });
        //Preliminary peerjs video connection
        element.delegate('.videoconnection','click', function(){
            var owner = $(this).attr('owner');
            $('#videoclosebtn').click( function(e){
                console.log("Closing "  + owner);
                if (self.peer1.managers[owner])
                    self.peer1.managers[owner].close();
                
                $('#videopanel').hide();
            });
            if (!self.peer1){
                alert('Enable your own camera befor connecting');
                return;
            }
            $('#videopanel').show();
            mc = self.peer1.call(owner, self.localstream);
            mc.on('stream', function(s){
                $('video').remove(); //Remove existing videos
                window.remote = s;
                  z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('#videoplace');
                  z.width(150);
                  z.click(function(evt){
                      $('video').addClass('videobig');
                  });
              });
            
         });
        
        element.delegate('.herd','click', function(){
            var herduid = $(this).attr('herd');
            self.core.activeherd({activeHerdId:herduid});
        });
        
        this.peerjsdiv.delegate("#cameraOnOff",'click',function(){
                if (this.checked){
                    //Turn on camera stream
                    navigator.getMedia = ( navigator.webkitGetUserMedia ||
                            navigator.getUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);
                    navigator.getMedia({audio: false, video: true}, function(s){
                      self.localstream = s;
                      // Create a new Peer with our demo API key, with debug set to true so we can
                      // see what's going on.
                      self.peer1 = new Peer(self.core.UID, { key: 'lwjd5qra8257b9', debug: true });
                      self.core.me().video({state:"on"});
                      self.peer1.on('call', function(c){
                        c.answer(s);
                      //  c.on('stream', function(s){
                      //    window.s = s;
                      //    z = $('<video></video>', {src: URL.createObjectURL(s), autoplay: true}).appendTo('body');
                      //  });
                      });
                    }, function(){});
                }
                else if (!this.checked){
                    //Turn off camers stream
                    self.core.me().video({state:"off"});
                    $('#videopanel').hide();
                    if (self.peer1){
                        $.each(self.peer1.managers, function(c){
                            self.peer1.managers[c].close()
                        });
                            
                        
                        self.peer1.destroy();
                        self.peer1 = null;
                    }
                }

        })
        
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
        
        var self = evt.data.widget;
        self._updateList(self);
    },
    
    _updateList: function(self) {        
        var peers = self.core.peers();
        var herds = [];
        $.each(self.core.herds(),function(i) {
            herds[i] = {};
            herds[i].uid = this.uid;
            herds[i].name = this.options.name;
            herds[i].active = this.options.active;
            herds[i].peers = this.members();
        });

        var element = self.element;
       
        if (true) {
        var names = '';
        $.each(herds,function() {
            var herd = this;
            if (herd.active){
                var remove = '';
                if(this.uid != 0) {
                    remove = ' <span class="removeherd" title="remove this herd and delete all features">remove</span><div class="removeherdconfirm verborgen">are you sure? <span class="yesremove" title"this will remove the herd and all its features, not easily undone">yes</span><span class="notremove" title="alrighty">no</span></div>';
                }
                if(this.uid==self.core.activeherd()) {
                    names = names + '<div><span class="peerlist herd me" title="this is your herd" herd="'+this.uid+'">'+this.name+'</span></div>';
                }
                else {
                    names = names + '<div><span class="peerlist herd" title="click to activate this herd" herd="'+this.uid+'">'+this.name+'</span>'+remove+'</div>';
                }
                $.each(this.peers, function(i){
                    var peer = self.core.getPeerByUid(herd.peers[i]);
                    if (peer){
                        if (peer.video().state === "on")
                            var videostring = '<img class="videoconnection" owner="'+peer.uid+'" src="./css/img/camera.png">';
                        else videostring = '';
                        if(this.uid==self.core.UID) {
                            names = names+ '<div class="peerlist peer me" title="this is you!" owner="'+peer.uid+'">'+peer.owner().name+'&nbsp;<img owner="'+peer.uid+'" class="location" src="./css/img/crosshair.png"></div>';
                            }
                            else {
                            names = names+ '<div class="peerlist peer owner" owner="'+peer.uid+'">'+peer.owner().name+'&nbsp;<img owner="'+peer.uid+'" class="location" src="./css/img/crosshair.png">&nbsp;<img class="extent" owner="'+peer.uid+'" src="./css/img/extents.png">&nbsp;'+videostring+'</div>';
                            }
                    }
                
                });
            }
        });

        
        
        
        
        self.listdiv.html(names);
        }
    }
    });

})(jQuery);



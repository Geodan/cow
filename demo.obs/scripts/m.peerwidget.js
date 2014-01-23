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
        element.append('<span><input type="text" id="newProject" data-i18n="txt_addnewproject" value="' + (translator.translate('txt_addnewproject') || 'Add a new project') + '" data-mini="true" size="25"><span data-i18n="txt_add" class="addProject licht">' + (translator.translate('txt_add') || 'Add')+'</span></span>');
        element.append('<div id="peerjs"></div>');
        this.listdiv = element.find('#list');
        this.peerjsdiv = element.find('#peerjs');
       /* this.peerjsdiv.html('<br>Camera:' 
                + '<input type="checkBox" id="cameraOnOff">'
                + '<div id="videopanel">'
                + '<h2>Video:</h2><button id="videoclosebtn">Close</button>'
                + '<div id="videoplace"></div>'
                + '</div>');
        */
        core = $(this.options.core).data('cow');
        this.core=core;
        this.oldprojects = [];
        
        core.bind("ws-disconnected", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerInfo", {widget: self}, self._onPeerStoreChanged);
        core.bind("ws-peerGone", {widget: self}, self._onPeerStoreChanged);
        core.bind("peerStoreChanged" ,{widget: self}, self._onPeerStoreChanged);
        core.bind("projectListChanged" ,{widget: self}, self._onPeerStoreChanged);
        
        element.delegate('.location','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var location = peer.position().point;
            self.core.center({position:location.coords});
            toggleLeft();
        });
        
        element.delegate('.extent','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var bbox = peer.view().extent;
            self.core.center({view:bbox});
            toggleLeft();
        });
        element.delegate('.removeproject','click', function(){
            $(this).siblings('.removeprojectconfirm').removeClass('verborgen');
        });
        element.delegate('.notremove','click', function(){
            $(this).parent().addClass('verborgen');
        });
        element.delegate('#newProject','click', function(){
            $(this).addClass('newProjectActive');
            var value = $(this).val();
            if(value == "Add a new project") $(this).val('');
            $(this).siblings('.addProject').removeClass('licht');
        });
        element.delegate('#newProject','blur', function(){
            $(this).removeClass('newProjectActive');
            var value = $(this).val();
            if(value == "") $(this).val('Add a new project');
            $(this).siblings('.addProject').addClass('licht');
        });
        element.delegate('.yesremove','click', function(){
            var projectID= $(this).parent().siblings('.project').attr('project');
            self.core.removeProject(projectID);
            //$(this).parent().addClass('verborgen');
            
        });
         element.delegate('.addProject','click', function(){
            var time = new Date().getTime();
            var name = $('#newProject').val();
            self.core.projects({uid: time,name:name, peeruid: self.core.UID});
            $('#newProject').val('Add a new project');
            //$(this).parent().addClass('verborgen');
            
        });
        //Preliminary peerjs video connection
      /*  element.delegate('.videoconnection','click', function(){
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
            
         });*/
        
        element.delegate('.project','click', function(){
            var projectuid = $(this).attr('project');
            self.core.activeproject({activeProjectId:projectuid});
        });
        
    /*    this.peerjsdiv.delegate("#cameraOnOff",'click',function(){
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

        })*/
        
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
        var projects = [];
        $.each(self.core.projects(),function(i) {
            projects[i] = {};
            projects[i].uid = this.uid;
            projects[i].name = this.options.name;
            projects[i].active = this.options.active;
            projects[i].peers = this.members();
        });

        var element = self.element;
       
        if (true) {
        var names = '';
        $.each(projects,function() {
            var project = this;
            if (project.active){
                var remove = '';
                if(this.uid != 0) {
                    remove = ' <span class="removeproject" data-i18n="txt_remove" title="'+ (translator.translate('txt_removeprojectfeats') || 'remove this project and delete all features') + '">' + (translator.translate('txt_remove') || 'remove' ) + '</span><div data-18n="txt_yousure" class="removeprojectconfirm verborgen">'+ (translator.translate('txt_yousure') || 'are you sure?') + '<span class="yesremove" data-i18n="txt_yes" title"' + (translator.translate('txt_projectwillberemoved') || 'this will remove the project and all its features, not easily undone') + '">' + (translator.translate('txt_yes') || 'yes') + '</span><span class="notremove" data-i18n="txt_no" title="alrighty">' + (translator.translate('txt_no') || 'no') +'</span></div>';
                }
                if(this.uid==self.core.activeproject()) {
                    names = names + '<div><span class="peerlist project me" title="' + (translator.translate('txt_yourproject') ||  'this is your project') + '" project="'+this.uid+'">'+this.name+'</span></div>';
                }
                else {
                    names = names + '<div><span class="peerlist project" title="' + (translator.translate('txt_activateproject') || 'click to activate this project' ) + '" project="'+this.uid+'">'+this.name+'</span>'+remove+'</div>';
                }
                $.each(this.peers, function(i){
                    var peer = self.core.getPeerByUid(project.peers[i]);
                    if (peer){
                        if (peer.video().state === "on")
                            var videostring = '<img class="videoconnection" owner="'+peer.uid+'" src="./css/img/camera.png">';
                        else videostring = '';
                        if (peer.position().point)
                            var positionstring = '<img owner="'+peer.uid+'" class="location" src="./css/img/locator.svg">';
                        else positionstring = '';
                        if(peer.uid==self.core.UID) {
                            names = names+ '<div class="peerlist peer me" title="' + (translator.translate('txt_thisisyou') || 'this is you!') + '" owner="'+peer.uid+'">'+peer.owner().name+'&nbsp;'+ positionstring + '</div>';
                            }
                            else {
                            names = names+ '<div class="peerlist peer owner" owner="'+peer.uid+'">'+peer.owner().name+'&nbsp;'+positionstring+'&nbsp;<img class="extent" owner="'+peer.uid+'" src="./css/img/extent.svg">&nbsp;'+videostring+'</div>';
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



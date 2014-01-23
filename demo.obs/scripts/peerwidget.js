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
    
    toggleFullScreen: function(element) {
      
      if (!document.fullscreenElement &&    // alternative standard method
          !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
      } else {
        if (document.cancelFullScreen) {
          document.cancelFullScreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
    },
    
    connectedPeersList: function(peerObj){
        var self = this;
        switch(arguments.length) {
        case 0:
            return this._connectedPeers;
            break;
        case 1:
            var existing = false;
            for (var i=0;i<this._connectedPeers.length;i++){
                if (this._connectedPeers[i].id == peerObj.id) {
                    existing = true; //Already a member
                    return this._connectedPeers[i];
                }
            }
            if (!existing)
                this._connectedPeers.push(peerObj); //Adding to the list
            return peerObj;
            break;
        default:
            throw('wrong argument number');
        }
    },
    removeConnection: function(id){
        for (var i=0;i<this._connectedPeers.length;i++){
            if (this._connectedPeers[i].id == id) {
                this._connectedPeers.splice(i,1); //Remove from list
                return;
            }
        }
    },
    _create: function() {
        var core;
        var self = this;        
        var element = this.element;
       
        this.peer1;
        this.ls;
        this._connectedPeers = [];
        this.connectedPeers = {};
        
        element.append('<div id="list"></div>');
        element.append('<span><input type="text" id="newProject" value="' + translator.translate('txt_addnewproject')+ '" size="15"><span class="addProject licht">' + translator.translate('txt_add') + '</span></span>');
        element.append('<div id="peerjs"></div>');
        this.listdiv = element.find('#list');
        this.peerjsdiv = element.find('#peerjs');
        this.peerjsdiv.html('<br>Camera:' 
                + '<input type="checkBox" id="cameraOnOff">'
                + '<div id="videopanel">'
                + '<h2>Video:</h2>'
                + '<div id="videoplace"></div>'
                + '</div>');
        
        core = $(this.options.core).data('cow');
        this.core=core;
        this.oldprojects = [];
        
        core.bind("ws-connected", {widget: self}, self._onWebscoketConnection);
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
        });
        
        element.delegate('.extent','click', function(){
            var owner = $(this).attr('owner');
            var peer = core.getPeerByUid(owner);
            var bbox = peer.view().extent;
            self.core.center({view:bbox});
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
            self.core.projects({_id: time,name:name, peeruid: self.core.UID});
            $('#newProject').val('Add a new project');
            //$(this).parent().addClass('verborgen');
        });
        element.delegate('.videoconnection','click', function(){
            var owner = $(this).attr('owner');
            self._makeVideoConnection(owner);
         });
        
        element.delegate('.project','click', function(){
            var projectuid = $(this).attr('project');
            self.core.activeproject({activeProjectId:projectuid});
        });
        
        element.delegate('.group','click', function(){
            var group_id = $(this).attr('group');
            var group = self.core.project.getGroupById(group_id);
            if ($(this).hasClass('me')){
                group.removeMember(self.core.UID);
            }
            else{
                group.members(self.core.UID);
            }
        });
        
        this.peerjsdiv.delegate("#cameraOnOff",'click',function(){
            if (this.checked){
                var bigvid = $('body').append('<div id="bigvideo"></div>');
                
                //Turn on camera stream
                navigator.getMedia = ( navigator.webkitGetUserMedia ||
                       navigator.getUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
                navigator.getMedia({audio: false, video: true}, function(s){
                        /*
                    var videoUrl = URL.createObjectURL(s);
                    d3.select('#videodiv' + self.core.UID)
                        .append('xhtml:video')
                        .classed('myvideo',true)
                        .attr("style", "display: block; margin-left: 0px; width: 100px; height: 100px;")
                        .attr("autoPlay",true)
                        .attr("muted",true)
                        .append("source")
                        .attr("src", videoUrl);    
                       */ 
                        
                    self.localstream = s;
                    self.core.me().video({state:"on"});
              }, function(){});
            }
            else if (!this.checked){
                //Turn off camera stream.
                self.core.me().video({state:"off"});
                self.localstream.stop();
                self.connectedPeers = []; //No more peers connected
                p = $('#videoplace').empty(); //Sweep video place
                $('#videopanel').hide();
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
    _onWebscoketConnection: function(evt){
        var self = evt.data.widget;
        self.mediaConnections = [];
        // Create a new Peer with our demo API key
        // TODO: in the future this has to move to our own websocket server
        self.peer1 = new Peer(self.core.UID, { 
            //host: 'websocket.geodan.nl',
            //port: 443,
            //secure: true,
            key: '3ryspwpldblc8fr', 
            debug: 3 
        });
        
        self.peer1.on('open', function(id){
          console.log('peerjs: Connected to socket');
        });
        self.peer1.on('connection', function(c){
           console.log('peerjs: incoming dataconnection (do nothing)');
        });
        self.peer1.on('call', function(c){
          console.log('peerjs: incoming call (responding with localstream)');
          if (self.localstream){
              c.answer(self.localstream);
          }
        });
    },
    
    _onPeerStoreChanged: function(evt) {
        
        var self = evt.data.widget;
        self._updateList(self);
    },
    _makeVideoConnection: function(peerid){
        var self = this;
        var videobox;
        var mc;
        var peerid = peerid;
        if (!self.localstream){
            alert('You need to enable your own camera first');
            return;
        }
        function startVideo(stream){
            var peerObj = {id: peerid, streamUrl: URL.createObjectURL(stream)}; 
            self.connectedPeersList(peerObj);
            self._updateVideos(self);
        }
        function stopVideo(){
            console.log('peerjs: ' + mc.peer + ' has left the chat.');
            self.removeConnection(mc.peer);
            delete self.connectedPeers[mc.peer];
            self._updateVideos(self);
        }
        if (!self.connectedPeers[peerid]) {
            mc = self.peer1.call(peerid, self.localstream); //We need to add a localstream, even if the other peer doesnt need it
            mc.on('error', function(err) { alert(err); });
            mc.on('stream', startVideo);
            mc.on('close', stopVideo);
        }
        self.connectedPeers[peerid] = 1;
        tmp = self;
    },
    _updateVideos: function(self){
        //  DOING THE D3 way on the map:
            var conns = self.connectedPeersList();
            //Find how many available
            //var curBoxes = d3.selectAll('.videobox').length;
            
            var videos = d3.select('#videolayer').selectAll('.videobox')
                .data(conns, function(d){return d.id});
            var svg = videos.enter().append('svg');
            var defs = svg.append('defs');
            var mask = defs.append('mask')
                .attr('id','c1')
                .attr('maskUnits','userSpaceOnUse')
                .attr('maskContentUnits','userSpaceOnUse')
                .append('g').attr('id','group')
                .append('circle').attr('cx',100).attr('cy',100).attr('r',35).attr('fill','white')
                .append('rect').attr('x',0).attr('y',0).attr('width',400).attr('height',400).attr('opacity',0);
            svg.append('use').attr('xlink:href','#group');
            
            var clippath = defs.append('clipPath').attr('id','clippy');
            clippath.append('circle').attr('cx',"100").attr('cy',"100").attr('r',50);
            
            svg.append('foreignObject')
			    .append('xhtml:div')
			    //.attr('clip-path','url(#clippy)') //TODO: doesn't work
			    .classed('videobox',true)
			    .attr('id',function(d){return 'videobox' + d.id;})
                .on('click',function(d){
                    var box = d3.select('#videobox'+ d.id).select('video');
                    
                    //self.toggleFullScreen($('#videobox'+ d.id)[0]);
                    
                    if (box.attr('selected') == 'true'){
                         box.transition().duration(500)
                            .style('width','200px')
                            .style('height','200px')
                            .style('margin-left','0px')
                            .style('margin-top','0px')
                            //.style("mask",'url("#c1")') //for firefox
                            //.style('-webkit-mask','url("#c1")')//for chrome
                            .attr('selected',false);
                    }
                    else{
                        box.transition().duration(500)
                            .style('width','1000px')
                            .style('height','1000px')
                            .style('margin-left','0px')
                            .style('margin-top','-100px')
                            .style("mask",'none') //for firefox
                            //.style('-webkit-mask','none')//for chrome
                            //.style("mask",'url("./css/videomask_big.svg#c1")') //for firefox
                            //.style('-webkit-mask','url("./css/videomask_big.svg")')//for chrome
                            .attr('selected',true);
                    }
                    
                })
                .append('xhtml:video')
                .classed('myvideo',true)
                .style('width','200px')
                .style('height','200px')
                .style('margin-left','0px')
                .style('margin-top','0px')
                .attr("style", "display: block; margin-left: 0px; width: 200px; height: 200px;")
                //.style("mask",'url("#c1")') //for firefox
                //.style('-webkit-mask','url("#c1")')//for chrome
                .attr("autoPlay",true)
                .attr("muted",true)
                .append("source")
                .attr("src", function(d){
                    return d.streamUrl;
                })
                ;
            videos.exit().remove();
    },
    _updateList: function(self) {        
        var peers = self.core.peers();
        var projects = [];
        $.each(self.core.projects(),function(i) {
            projects[i] = {};
            projects[i]._id = this._id;
            projects[i].name = this.options.name;
            projects[i].active = this.options.active;
            projects[i].peers = this.members();
            projects[i].groups = this.groups();
        });

        var element = self.element;
       
        if (true) {
        var names = '';
        $.each(projects,function() {
            var project = this;
            if (project.active){
                var groups = "" ;
                $.each(project.groups, function(i,d){
                    if (d.hasMember(self.core.UID))
                        groups = groups + "<span class='group me' group="+d._id+">"+d.name+ "</span>, ";
                    else
                        groups = groups + "<span class = 'group' group="+d._id+">" + d.name+ "</span>, ";
                })
                
                var remove = '';
                if(this._id != 0) {
                    remove = ' <span class="removeproject" title="' + translator.translate('txt_projectwillberemoved') + '">' + translator.translate('txt_remove') + '</span><div class="removeprojectconfirm verborgen">' + translator.translate('txt_yousure') + '<span class="yesremove" title"' + translator.translate('txt_projectwillberemoved') + '">"' + translator.translate('txt_yes')+'</span><span class="notremove" title="alrighty">"' + translator.translate('txt_no') + '</span></div>';
                }
                if(this._id==self.core.activeproject()) {
                    names = names + '<div><span class="peerlist project me" title="' + translator.translate('txt_yourproject') + '" project="'+this._id+'">'+this.name+'</span></div>';
                    names = names + '<div><small>'+groups+'</small></div>';
                }
                else {
                    names = names + '<div><span class="peerlist project" title="' + translator.translate('txt_activateproject') + '" project="'+this._id+'">'+this.name+'</span>'+remove+'</div>';
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
                            names = names+ '<div class="peerlist peer me" title="' + translator.translate('txt_thisisyou') + '" owner="'+peer.uid+'">'+peer.owner().name+'&nbsp;'+positionstring+'</div>';
                            }
                            else {
                            names = names+ '<div class="peerlist peer owner" owner="'+peer.uid+'">'+peer.owner().name+'&nbsp;'+positionstring+'&nbsp;<img class="extent" owner="'+peer.uid+'" src="./css/img/extents.png">&nbsp;'+videostring+'</div>';
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



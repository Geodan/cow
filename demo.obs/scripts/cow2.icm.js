var icm = {};
/**
    peers() - return only non-deleted (active) peers
**/
icm.peers = function(){
    return _(core.peers()).filter(function(d){
        return (!d.deleted());
    });
};
/**
    features(permtype) - return non-deleted features with permission type permtype or that belong to user
**/
icm.features = function(permtype){
    return _(core.project().items()).filter(function(d){
        if (permtype){
            //return (!d.deleted() && d.hasPermission(permtype) && d.data('type')=='feature') || (!d.deleted() && d.data('creator') == core.user().id() && d.data('type')=='feature');
            return (!d.deleted() && d.data('type') == 'feature' && d.hasPermission(permtype)) || (!d.deleted() && d.data('type') == 'feature' && d.data('creator') == core.user().id());
        }
        else {
            return (!d.deleted() && d.data('type')=='feature');
        }
    });
};
/**
    featureCollections() - return non-deleted features with permission type permtype or that belong to user
**/
icm.featureCollections = function(){
    return _(core.project().items()).filter(function(d){
        return (d.data('type') == 'featureCollection' && (!d.deleted() || (!d.deleted() && d.data('creator') == core.user().id() ) ) ); 
    });
};


/**
    messages(permtype) - return non-deleted items that have a 'msg' data object with permission type permtype or that belong to user 
**/
icm.messages = function(permtype){
    var messages =  _(core.project().items()).filter(function(d){
        if (permtype){
            return (!d.deleted() && d.data('msg') != null && d.hasPermission(permtype)) || (!d.deleted() && d.data('msg') != null && d.data('creator') == core.user().id());
        }
        else{
            return (!d.deleted());
        }
    });
    var returnarr =  _(messages).sortBy(function(message) {
        return message.timestamp();
    });
    return returnarr.reverse();
};
/**
    groups() - return non-deleted groups in project
**/
icm.groups = function(){
    return _(core.project().groups()).filter(function(d){return !d.deleted();});
};
/**
    users() - return non-deleted users that are in current project
**/
icm.users = function(){
    //first get peers
    var peers = _(core.peers()).filter(function(d){return d.data('activeproject') == core.project().id();});
    var users = [];
    for (var i = 0; i<peers.length;i++){
        var userid = peers[i].user(); 
        users.push(core.users(userid));
    }
    return users;
    //return _(peers).filter(function(d){return !d.deleted();});
};
/**
    activeusers() - return users that are currently active
**/
icm.activeusers = function(){
    return _(core.users()).filter(function(d){return d.isActive();});
};
/**
    projects() - return non-deleted projects
**/
icm.projects = function(){
    return _(core.projects()).filter(function(d){return !d.deleted();});
};
/**
    usernames() - return array of non-deleted usernames
**/
icm.usernames = function(){
    var returnArr = [];
    var users = icm.users();
    for (var i = 0;i<users.length;i++){
        if (users[i].data('name')){
            returnArr.push(users[i].data('name'));
        }
    }
    return returnArr;
};
/**
    tags() - return array of used names in items
**/
icm.tags = function(){
    var returnArr = [];
    var items = core.project().items();
    for (var i = 0;i<items.length;i++){
        if (items[i].data('name')){
            returnArr.push(items[i].data('name'));
        }
    }
    return returnArr;
};

/**
    layers() - return leaflet layers from project
**/
icm.layers = function(){
    if (core.project()){
        return core.project().data('layers') || [];
    }
    else {
        return [];
    }
};

/**
    baseLayers() - return leaflet baseLayers from project
**/
icm.baselayers = function(){
    if (core.project()){
        return core.project().data('tilelayers') || [];
    }
    else {
        return [];
    }
};

/**
    msg(item) - create a messagebox based on the item
        purpose is to edit the properties of the item, including permisions
**/
icm.msg = function(msgbox,item){
    
    //var msgbox = d3.select(this).style('display','block');
    //msgbox.html(''); //clear contents
    var name = item.data('name');
    var msg = item.data('msg');
    
    //document.getElementById('nwmsg'+item.id()).focus();  
    msgbox.append('br');
    //msgbox.append('button').attr('id','nwmsgsubmit').html('Send');
    /*
    var formbox = msgbox.append('div').classed('individueel',true).attr('id','permlist');
    var allgroups = icm.groups();
    var permissions = d3.select('#permlist').selectAll('.permission').data(allgroups);
    //Add on/off button for every group
    var pdiv = permissions.enter().append('div')
            .attr('class',function(d){
                if (item.permissionHasGroup('edit',[d._id])) {
                    return 'permission selected';
                }
                else {
                    return 'permission unselected';
                }
            })
            .on('click',function(d){
                if (d3.select(this).classed('unselected')){
                    d3.select(this).classed('selected',true).classed('unselected',false);
                    item.permissions('edit',d._id).sync();
                    console.log('Permission added');
                }
                else {
                    d3.select(this).classed('unselected',true).classed('selected',false);
                    item.removePermission('edit',[d._id]);
                    item.sync();
                    //core.itemstore().items('feature',{data:item.flatten()},'user');
                    console.log('Permission removed');
                }
            });
        pdiv.append('span').attr('class',function(d){
                    return 'group ' + d.data('name');
            });
        pdiv.append('span')
            .html(function(d){return d.data('name');});
    */
    // textcomplete from: http://yuku-t.com/jquery-textcomplete/
    var names = icm.usernames();
    var tags = icm.tags();
    $('#nwmsg'+item.id()).textcomplete([
    {
        match: /(^|\s)@(\w*)$/,
        search: function (term, callback) {
          callback($.map(names, function (element) {
                return element.indexOf(term) === 0 ? element : null;
            }));
        },
        replace: function (value) {
          return '$1@' + value + ' ';
        }
     },{
        match: /(^|\s)#(\w*)$/,
        search: function (term, callback) {
          callback($.map(tags, function (element) {
                return element.indexOf(term) === 0 ? element : null;
            }));
        },
        replace: function (value) {
          return '$1#' + value + ' ';
        }
     }]);
    
    
};

/**
**/
icm.tracker = function(status){
    this.running = false;
    var self = this;
};
icm.tracker.prototype = {
     _point2position: function(point) {
        var attributes = { uid: core.user().id(), owner: core.user().data('name')};
        if(point.time) {
            attributes.time = point.time;
        }
        else {
            if(!this.params.locationFeature) {
                console.warn('Recieved a position without time, defaulting to current time');
                var time = new Date();
                attributes.time = time.getTime();
            }
        }
        var _position = { 
            "id": core.peerid(),
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [ point.coords.longitude,point.coords.latitude
                ]
            },
            "properties": attributes
        };
        return _position;
    },
	_setPosition: function(position){
	    var _parsePosition = function(nsidom_obj){
            var position = {};
            position.coords = {};
            position.coords.longitude = nsidom_obj.coords.longitude;
            position.coords.latitude = nsidom_obj.coords.latitude;
            position.time = nsidom_obj.timestamp;
            return position;
        };
	    position = _parsePosition(position);
	    //Only update my position when my coords changed or maximum age exceeded
        //TODO: make a proper distance check in meters
        var dx = self.prevPosition.coords.longitude - position.coords.longitude;
        var dy = self.prevPosition.coords.latitude - position.coords.latitude;
        var diff = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));//diff is in degrees couple of meters..
        var timediff = (position.time - self.prevPosition.time) / 1000;
        //TODO: make diff and timediff configurable
        if (!(core.location()) || diff > 0.00005 || timediff > (15 * 60)){ //first position or more than 0.000001 degrees diff or more than 15 mins old  
            core.location(self._point2position(position));
            self.prevPosition = position;
        }
        
	},
	_showError: function(error){
	  switch(error.code) 
		{
		case error.PERMISSION_DENIED:
		  innerHTML="User denied the request for Geolocation.";
		  break;
		case error.POSITION_UNAVAILABLE:
		  innerHTML="Location information is unavailable.";
		  break;
		case error.TIMEOUT:
		  innerHTML="The request to get user location timed out.";
		  break;
		case error.UNKNOWN_ERROR:
		  innerHTML="An unknown error occurred.";
		  break;
		}
		console.warn(innerHTML);
	},
    startTracking: function(){
        self = this;
        if (navigator.geolocation)
		{
		    this.prevPosition = {coords:{latitude: 0, longitude:0}};
		    this.geolocationid = window.navigator.geolocation.watchPosition( 
                this._setPosition, 
                this._showError, 
                {
                    enableHighAccuracy: true //Wether or not to make use of GPS
                    //timeout: 10000, //Maximum time allowed to get a fix
                    //maximumAge: 5000 //Maximum age allowed to use a cached position
                } 
		    );
		    this.running = true;
		}
		else{
		    console.warn("Geolocation is not supported by this browser.");
		}
    },
    stopTracking: function(){
        navigator.geolocation.clearWatch(this.geolocationid);
        this.running = false;
    }
};

/***

getLocation - starts location polling and triggers a newlocation event

***/
$.Cow.GeoLocator.prototype = {
	self: null,
	//TT: Need to parse the nsidom_obj for some reason i forgot...
	_parsePosition: function(nsidom_obj){
		var position = {};
		position.coords = {};
		position.coords.longitude = nsidom_obj.coords.longitude;
		position.coords.latitude = nsidom_obj.coords.latitude;
		position.time = nsidom_obj.timestamp;
		return position;
	},
	_showPosition: function(position){
			position = self._parsePosition(position);
			//console.log('locationChange');
			var me = self.core.me();
			if (me) {
				//Only update my position when my coords changed or maximum age exceeded
				//TODO: make a proper distance check
				if (JSON.stringify(this.prevPosition) != JSON.stringify(position.coords)){ 
				    me.position({point:position});
				}
				this.prevPosition = position.coords;
			}
	},
	_showError: function(error){
	  switch(error.code) 
		{
		case error.PERMISSION_DENIED:
		  innerHTML="User denied the request for Geolocation."
		  break;
		case error.POSITION_UNAVAILABLE:
		  innerHTML="Location information is unavailable."
		  break;
		case error.TIMEOUT:
		  innerHTML="The request to get user location timed out."
		  break;
		case error.UNKNOWN_ERROR:
		  innerHTML="An unknown error occurred."
		  break;
		}
		console.warn(innerHTML);
	},
	_setGeoLocation: function(){
		console.log('Start polling geolocation');
		var geolocationid = window.navigator.geolocation.watchPosition( 
			this._showPosition, 
			this._showError, 
			{
				enableHighAccuracy: true, //Wether or not to make use of GPS
				timeout: 10000, //Maximum time allowed to get a fix
  				maximumAge: 5000 //Maximum age allowed to use a cached position
			} 
		);
		window.setTimeout( function () {
				console.log('Stop polling geolocation');
				window.navigator.geolocation.clearWatch( geolocationid ) 
			}, 
			5000 //stop checking after 5 seconds
		);
	},
	getLocation: function(){
		self = this;
		
		if (navigator.geolocation)
		{
			this._setGeoLocation();//first one
			window.setInterval( function () {
				self._setGeoLocation();
				}, 
				10000 //check every 10 seconds
			);
		}
	  else{alert("Geolocation is not supported by this browser.")}
	}
}





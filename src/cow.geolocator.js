/***

getLocation - starts location polling and triggers a newlocation event

***/
$.Cow.GeoLocator.prototype = {
	self: null,
	_parsePosition: function(nsidom_obj){
		var position = {};
		position.coords = {};
		position.coords.longitude = nsidom_obj.coords.longitude;
		position.coords.latitude = nsidom_obj.coords.latitude;
		position.timestamp = nsidom_obj.timestamp;
		return position;
	},
	_showPosition: function(position){
			position = self._parsePosition(position);
			//console.log('locationChange');
			var peer = self.core.me();
			if (peer) {
				var payload = {};
				payload.uid = self.core.UID;
				payload.position = position;
				position.coords.time = new Date().getTime();
				
				var point = {point: position.coords};
				
				self.core.me().position(point);
				//peer.events.trigger('mylocationChange', [payload]);
				//self.core.trigger('mylocationChange', [payload]);
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
		//console.log('Start polling geolocation');
		var geolocationid = window.navigator.geolocation.watchPosition( 
			this._showPosition, 
			this._showError, 
			{
				enableHighAccuracy: true,
				timeout: 10000,
  				maximumAge: 5000
			} 
		);
		window.setTimeout( function () {
				//console.log('Stop polling geolocation');
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





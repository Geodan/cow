/***

getLocation - starts location polling and triggers a newlocation event

***/
$.Cow.GeoLocator.prototype = {

	parsePosition: function(nsidom_obj){
		var position = {};
		position.coords = {};
		position.coords.longitude = nsidom_obj.coords.longitude;
		position.coords.latitude = nsidom_obj.coords.latitude;
		position.timestamp = nsidom_obj.timestamp;
		return position;
	},
	getLocation: function(){
		var self = this;
		var _showPosition = function(position){
			position = self.parsePosition(position);
			console.log('locationChange');
			var peer = self.core.me();
			var payload = {};
			payload.uid = self.core.UID;
			payload.position = position;
			peer.events.trigger('locationChange', [payload]);
			self.core.trigger('locationChange', [payload]);
		} 
		if (navigator.geolocation)
		{
			navigator.geolocation.watchPosition(_showPosition, this._showError);
		}
	  else{alert("Geolocation is not supported by this browser.")}
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
		//alert(innerHTML);
	}
	
}





(function($) {
$.widget("cow.PrintUserNameWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
	_create: function() {
        var core;
        var self = this;
        var element = this.element;
		this.username = "";

        //get the mapquery object
        core = $(this.options.core).data('cow');

		element.append('<div class="myname">' + self._getUserName() + '</div>');

		//change name when user changes it
/*         $('#myname').on('blur', function(e, ui) {
			var username = $(this).val();
			core.me().owner({name:username});
			setCookie("username",username,1);
		}); */
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_getUserName: function(evt,txtMessage) {
		var username=getCookie("username");
		if (username!=null && username!="") {
			core.username(username);
		} else {
			username = this._promptUserName();
		}
		return username;
    },
	_promptUserName: function() {
		var username = prompt("Please enter your name:","");
		if (username!=null && username!="") {
			core.username(username);
			setCookie("username",username,1);
		} else {
			username = this._promptUserName();
		}
		return username;
    }
	});
})(jQuery);

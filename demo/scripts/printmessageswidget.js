
(function($) {
$.widget("cow.PrintMessagesWidget", {
	options: {
        // The cow.core instance
        core: undefined
    },
	_create: function() {
        var core;
        var self = this;
        var element = this.element;
		this.messageNumber = 0;

        //get the mapquery object
        core = $(this.options.core).data('cow');

		//bind triggers to individual functions.
        core.bind("ws-connected", {widget: self}, self._onConnect);
        core.bind("ws-disconnected", {widget: self}, self._onDisConnect); 
		
        core.bind("ws-peerInfo", {widget: self}, self._onPeerInfo);
        core.bind("ws-peerGone", {widget: self}, self._onPeerGone);
        core.bind("peerStoreChanged" ,{widget: self}, self._onPeerStoreChanged);
        core.bind("projectListChanged" ,{widget: self}, self._onProjectListChanged);
        core.bind("storeChanged" ,{widget: self}, self._onStoreChanged);
		core.bind("meChanged" ,{widget: self}, self._onMeChanged);
		core.bind("layoutChanged" ,{widget: self}, self._onLayoutChanged);
		core.bind("myPositionChanged" ,{widget: self}, self._onMyPositionChanged);
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
	_getMessageString: function(evt,txtMessage) {
		var self = evt.data.widget;
		self.messageNumber = self.messageNumber + 1;
		var num = self.messageNumber;
		var txt = txtMessage;
        var string = "";
        string = '<div id="message' + num + '" class="messageItem">' +
				 '<div class="messageTitle"> Message #' + num + '</div>' +
				 '<div class="messageContent" data-i18n="' + txt + '">' + 
				 translator.translate(txt) + '</div>' + '</div>';
        return string;
    },
	_onConnect: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_connected'));
	},
	_onDisConnect: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_disconnected'));
	},
	_onPeerInfo: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_peerinfo'));
	},
	_onPeerGone: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_peergone'));
	},
	_onPeerStoreChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_peerstorechanged'));
	},
	_onProjectListChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_projectlistchanged'));
	},
	_onStoreChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_storechanged'));
	},
	_onMeChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_mechanged'));
	},
	_onLayoutChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_layoutchanged'));
	},
	_onMyPositionChanged: function(evt) {
		var self = evt.data.widget;
        var element = self.element;
		element.append(self._getMessageString(evt,'txt_mypositionchanged'));
	}

	});
})(jQuery);

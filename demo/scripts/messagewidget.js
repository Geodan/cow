(function($) {
$.widget("cow.MessageWidget", {
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
        self.core = core;
        var messages = [];
        self.messages= messages;
        core.bind("storeChanged" ,{widget: self}, self._onStoreChanged);
        setInterval(function(){ self._onStoreChanged({'data':{'widget':self}},true)},1000);
        $(element).delegate($('.msg'),'click',function(e){
            var item = $(e.target).parents('.msg').data('data');
            if(!item) return false;
            var i = self.core.itemstore().getItemById(item.id());
            i.read = new Date().getTime();
            self._onStoreChanged({'data':{'widget':self}})
            var bbox = L.geoJson(item.data()).getBounds();
            self.core.trigger('zoomToExtent',{bottom:bbox.getSouth(), top:bbox.getNorth(), left:bbox.getWest(), right:bbox.getEast()});
        });
    },
  
    
    _onStoreChanged: function(evt,reload) {
        var self = evt.data.widget;
        var items = self.core.itemstore().items('feature');
        var mygroups = self.core.project.myGroups();
        items.sort(function(a,b) {return a._timestamp - b._timestamp});
  
          $(self.element).empty();
          var nieuw = false;
        $.each(items, function(key, value) {
            if(value._status != "deleted"
                && (value.permissionHasGroup('edit',mygroups) || value.permissionHasGroup('view',mygroups))
                ) {
            var msg = self.message(value);
            if(msg != false) {
            if(!value.read || value.read < value.timestamp()) {
            nieuw = true;
            }
            $(self.element).append(self.message(value));
             $(self.element).children(':last-child').data('data',value);
            }
            }
            
        });
        nieuw?$('#bericht').addClass('nieuw'):$('#bericht').removeClass('nieuw');
		if(!reload)		$('#sidebar').animate({scrollTop:$("#sidebar").prop("scrollHeight") - $('#sidebar').height() },500);
       
    },
    message: function(data) {
        var html;
        var tijd = new Date().getTime();
        var seconds = (tijd - data._timestamp)/1000;
        if(seconds < 60) {
            seconds =  Math.round(seconds) + 's';
        }
        else if(60< seconds && seconds < 3600) {
            seconds = Math.round(seconds/60) + 'min';
        }
        else if(3600 < seconds && seconds  < 86400) {
            seconds = Math.round(seconds/3600) + 'uur';
        }
        else {
            seconds = Math.round(seconds/86400) + 'dagen';
        }
        
        var group = data.permissions('view');  
        var owner = data.permissions('edit');  
            var read = 'unread';
            if(data.read && data.read > data.timestamp()) read = 'read';
            else {
                $('#bericht').addClass('nieuw');
            }
        var message = '<div class="msg '+ read+'" title="click to see this message on the map"></div>';
        var mleft = '<div class="m-left"></div>';
        var mtijd = '<div class="mtijd" title="Dit bericht is zolang geleden binnengekomen">'+seconds+'</div>';
        var mshare = '<div class="mshare" title="Dit bericht is gedeeld met">';
        var mgroups ='';
        if(group.length > 0) {
        if($.inArray(1,group[0].groups) > -1 || $.inArray('1',group[0].groups) > -1) {
            mgroups += '<span class="group public" title="cop"></span><span class="group populatie" title="Populatie"></span><span class="group evacuatie" title="Evacuatie"></span><span class="group opvang" title="Opvang"></span>';
        }
        else {
        if($.inArray(2,group[0].groups) > -1 || $.inArray('2',group[0].groups) > -1 ) {
            mgroups += '<span class="group populatie" title="Populatie"></span>';
        }
        if($.inArray(3,group[0].groups) > -1 || $.inArray('3',group[0].groups) > -1 ) {
            mgroups += '<span class="group evacuatie" title="Evacuatie"></span>';
        }
        if($.inArray(4,group[0].groups) > -1 || $.inArray('4',group[0].groups) > -1 ) {
            mgroups += '<span class="group opvang" title="Opvang"></span>';
        }
        }
        }
        //TODO: add <span class="group public" title="cop"></span> per group
        mshare += mgroups + '</div>';
        var mright = '<div class="m-right"></div>';
        var ownername = '';
        if (owner.length > 0) {
            ownername = self.core.project.getGroupById(owner[0].groups[0]).name;
        }
        var mgroup = '<span class="group '+ownername+'" title="'+ownername+'"></span>';
        var msender = '<span class="msender">'+data.data().properties.creator+'</span>';
        var mtext;
        if(data.data().properties.desc !== undefined) {
             mtext = '<div class="mtext">'+data.data().properties.desc.replace(/\r\n?|\n/g, '<br />')+'</div>' 
             
            $('#lastmsg').empty().html(seconds);
        }
        else {return false}
        

       return $(message).append($(mleft).append(mtijd).append(mshare)).append($(mright).append(mgroup).append(msender).append(mtext));
       
        
    },
    
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
   
   
    });

})(jQuery);



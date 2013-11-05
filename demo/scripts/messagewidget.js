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
        setInterval(function(){ self._onStoreChanged({'data':{'widget':self}})},1000);
        $(element).delegate($('.msg'),'click',function(e){
            var item = $(e.target).parents('.msg').data('data');
            var bbox = L.geoJson(item.data()).getBounds();
            self.core.trigger('zoomToExtent',{bottom:bbox.getSouth(), top:bbox.getNorth(), left:bbox.getWest(), right:bbox.getEast()});
        });
    },
  
    
    _onStoreChanged: function(evt) {
        var self = evt.data.widget;
        var items = self.core.itemstore().items('feature');
        items.sort(function(a,b) {return a._timestamp - b._timestamp});
  
          $(self.element).empty();
        $.each(items, function(key, value) {
            if(value._status != "deleted") {
            var msg = self.message(value);
            if(msg != false) {
            $(self.element).append(self.message(value));
             $(self.element).children(':last-child').data('data',value);
            }
            }
            
        });
      

       
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
        var message = '<div class="msg unread" title="click to see this message on the map"></div>';
        var mleft = '<div class="m-left"></div>';
        var mtijd = '<div class="mtijd" title="Dit bericht is zolang geleden binnengekomen">'+seconds+'</div>';
        var mshare = '<div class="mshare" title="Dit bericht is gedeeld met"></div>';
        //TODO: add <span class="group cop" title="COP"></span> per group
        var mright = '<div class="m-right"></div>';
        var mgroup = '<span class="group populatie" title="populatie"></span>';
        var msender = '<span class="msender">'+data.data().properties.creator+'</span>';
        var mtext;
        if(data.data().properties.desc !== undefined) {
             mtext = '<div class="mtext">'+data.data().properties.desc+'</div>' 
             
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



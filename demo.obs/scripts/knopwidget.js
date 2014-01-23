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
$.widget("cow.KnopWidget", {
    options: {
        // The cow.core instance
        core: undefined
        
    },
 _create: function() {
        var core;
        var self = this;        
        var element = this.element;
        var current_icon;
        core = $(this.options.core).data('cow');
        icon = this.options.icon
        this.core=core;
        this.icon = icon;

        /* Listeners to be found in olmapwidget */         
        element.delegate('.newpoint','click', function(){
           
            var key = $(this).attr('newpoint');
            self.element.trigger("newpoint", key);
           
        });
        element.delegate('.newline','click', function(){
		
            var key = $(this).attr('newline');
            self.element.trigger("newline", key);
           
        });
        element.delegate('.newpoly','click', function(){
       
            var key = $(this).attr('newpoly');
            self.element.trigger("newpoly", key);
           
        });
        element.delegate('.stopdraw','click', function(){
        $(self.icon).html('').addClass('move');
            self.element.trigger("stopdraw"); 
        
        });
        element.on('click','.polysknop',function() {
            $('.polys').toggle('fold');
            $('.points').hide('fold');
            $('.lines').hide('fold');
        });
        element.on('click','.linesknop',function() {
            $('.lines').toggle('fold');
            $('.points').hide('fold');
            $('.polys').hide('fold');
        });
        element.on('click','.pointsknop',function() {
            $('.points').toggle('fold');
            $('.lines').hide('fold');
            $('.polys').hide('fold');
        });
		
		 element.on('click','.hoofdknop',function() {
		 $('.sideknop').hide('fold');
         });
		 
         element.on('click','.sknop',function() {
		 if($(this).hasClass('newpoint')){
		 $('#pointbutton').empty().html($(this).clone().removeClass('sknop'));
		 }
		 else if($(this).hasClass('newline')){
		 $('#linebutton').empty().html($(this).clone().removeClass('sknop'));
		 }
		 else if($(this).hasClass('newpoly')){
		 $('#polybutton').empty().html($(this).clone().removeClass('sknop'));
		 }
         $('.sideknop').hide('fold');
         });
  $('.sknop').click(function(){
    $(this).parent().toggle('fold');
  });
 element.append('<div class="knop hoofdknop pointknop "  id="helpbutton" title="Gebruik dit om snel vragen aan anderen te stellen"><span class="   newpoint" newpoint="./mapicons/mapicons/comment-map-icon.png"><img width=30 height=30 src="./mapicons/mapicons/comment-map-icon.png"></span>');
       
element.append('<div class="knop hoofdknop pointknop "  id="pointbutton" ><span class="   newpoint" newpoint="./mapicons/mapicons/comment-map-icon.png"><img width=30 height=30 src="./mapicons/mapicons/comment-map-icon.png"></span>');
         element.append('<div class="knop pointsknop subknop">');
        element.append('<div class="sideknop points" style="display:none">');
        $.getJSON('./mapicons/progideon_list.js', function(data) {
            
            $.each(data.icons, function(key,val) {
                
                element.find('.points').append('<span class=" sknop  newpoint" newpoint="./mapicons/' + val + '"><img width=30 height=30 src="./mapicons/'+val+'"></span>');
            });
        });
        element.append('<div class="knop hoofdknop lineknop" id="linebutton" ><span newline="#000" class=" newline"><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"    xmlns="http://www.w3.org/2000/svg" version="1.1" width="29" height="29"><g  transform="translate(-27.086869,-417.52882)"><path   transform="translate(27.086869,429.63625)" d="M 7.3188002,12.071144 23.749999,2.4282866 10.267857,-1.9467135 20.401786,-5.8306419" style="stroke:#000;stroke-width:2;fill:none;" /></g></svg></span>');
        element.append('<div class="knop linesknop subknop">');
        element.append('<div class="sideknop lines" style="display:none">');
        var lkleuren = ['#000','#204a87','#f57900','#204a87','#cc0000','#5c3566','#4e9a06'];
        $.each(lkleuren, function(key, val){
             element.find('.lines').append(
             '<span newline="'+val+'"class="sknop newline"><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"    xmlns="http://www.w3.org/2000/svg" version="1.1" width="29" height="29"><g  transform="translate(-27.086869,-417.52882)"><path   transform="translate(27.086869,429.63625)" d="M 7.3188002,12.071144 23.749999,2.4282866 10.267857,-1.9467135 20.401786,-5.8306419" style="stroke:'+val+';stroke-width:2;fill:none;" /></g></svg></span>'
             );
        });
        element.append('<div class="knop  hoofdknop polyknop"  id="polybutton" ><span newpoly="#5c35660" class=" newpoly"><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"    xmlns="http://www.w3.org/2000/svg" version="1.1" width="29" height="29"><g  transform="translate(-27.086869,-417.52882)"><path d="M 2.7731138,5.3788833 14.252526,11.064017 26.527918,3.1859009 20.874459,-6.2398619 7.3960719,-3.9366059 z" transform="translate(27.086869,429.63625)"      style="fill:#5c3566;fill-opacity:0.7;stroke:#5c3566;stroke-width:1;" /></g></svg></span>');
        element.append('<div class="knop polysknop subknop">');
        element.append('<div class="sideknop polys" style="display:none">');
        var pkleuren = ['#000','#204a87','#f57900','#204a87','#cc0000','#5c3566','#4e9a06'];
        $.each(pkleuren, function(key, val){
             element.find('.polys').append(
             '<span newpoly="'+val+'"class="sknop newpoly"><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"    xmlns="http://www.w3.org/2000/svg" version="1.1" width="29" height="29"><g  transform="translate(-27.086869,-417.52882)"><path d="M 2.7731138,5.3788833 14.252526,11.064017 26.527918,3.1859009 20.874459,-6.2398619 7.3960719,-3.9366059 z" transform="translate(27.086869,429.63625)"      style="fill:'+val+';fill-opacity:0.7;stroke:'+val+';stroke-width:1;" /></g></svg></span>'
             );
        });
        element.append('<div class="stopdraw drawobjects"></div>');
         element.find('.stopdraw').append('<span class="drawbtn move" ></span>')
         
          /*  names = names + '<div class="peerlist linediv">';
            names = names + '<b>Line colors </b><br/>';
            names = names + '</div>';
            names = names + '<span newline="black" class="peerlist newline" title="Black line"><hr color="black"></span>';
            names = names + '<span newline="#204a87" class="peerlist newline" title="Blue line"><hr color="#204a87"></span>';
            names = names + '<span newline="#f57900" class="peerlist newline" title="Orange line"><hr color="#f57900"></span>';
            names = names + '<span newline="#cc0000" class="peerlist newline" title="Red line"><hr color="#cc0000"></span>';
            names = names + '<span newline="#5c3566" class="peerlist newline" title="Purple line"><hr color="#5c3566"></span>';    
            names = names + '<span newline="#4e9a06" class="peerlist newline" title="Green line"><hr color="#4e9a06"></span>';

            names = names + '<div class="peerlist polydiv">';
            names = names + '<p><b>Polygon colors</b></p>';
            names = names + '</div>';        
            names = names + '<span newpoly="#4e9a06" class="peerlist newpoly" title="Green polygon"><div style="background:#4e9a06">&nbsp;</div></span>';
            names = names + '<span newpoly="#cc0000" class="peerlist newpoly" title="Red polygon"><div style="background:#cc0000">&nbsp;</div></span>';
            names = names + '<span newpoly="#fce94f" class="peerlist newpoly" title="Yellow polygon"><div style="background:#fce94f">&nbsp;</div></span></p>';
            names = names + '<span newpoly="#f57900" class="peerlist newpoly" title="f57900 polygon"><div style="background:#f57900">&nbsp;</div></span></p>';
           // element.html(names);
        */
        
        //$(this.options.name).change(function(){self._updateName({data:{widget: self,name: $(this).val()}})});
    },
    _destroy: function() {
        this.element.removeClass('ui-dialog ui-widget ui-widget-content ' +
                                 'ui-corner-all')
            .empty();
    },
    _onLoaded: function(evt) {
        console.log('_onLoaded');
        var self = evt.data.widget;
    
    }
    
    });
})(jQuery);



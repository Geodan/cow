(function(){
    var translator = {};
    window.translator = translator;
    
    getUrlVars = function()
    {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for(var i = 0; i < hashes.length; i++)
        {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    };

    translator.loadBundles = function() {
        //Load translations (default english)
        var lang = getUrlVars()["lang"] || 'nl';
        jQuery.i18n.properties({
            name:'Messages',
            path:'lang/',
            mode:'both',
            language:lang,
            callback: function(){
                //Translate some static texts
                $('#myname').attr('title',$.i18n.prop('txt_clicktochangename'));
                $('#connect').attr('title', $.i18n.prop('txt_clicktoconnect'));
                $('#txt_welcome').html($.i18n.prop('txt_welcome'));
                $('#maptitle').html($.i18n.prop('maptitle'));
                $('#addfeattitle').html($.i18n.prop('addfeattitle'));
                $('#deletedfeats').html($.i18n.prop('deletedfeats'));
                $('#peerstitle').html($.i18n.prop('peerstitle'));
            }
        });
    };
})();

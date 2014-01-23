(function(){
    var translator = {};
    window.translator = translator;
    
    //Check for jquery i18n libs
    if (!i18n)
        console.error('Jquery i18n module not loaded!');
    
    //internal function
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

    //load the language properties
    /*
    translator.loadBundles = function(config) {
        var callbackfunc = (config && config.callback) || function(){};
        var path = (config && config.path) || 'lang/';
        var lang = getUrlVars()["lang"] || (config && config.lang) || 'en';
        //Load translations (default english)
        $.i18n.properties({
            name:'Messages',
            path: path,
            mode:'both',
            language:lang,
            callback: callbackfunc
        });
    };
    */
    translator.loadBundles = function(config) {
        var callbackfunc = (config && config.callback) || function(){};
        var path = (config && config.path) || 'lang/';
        var lang = getUrlVars()["lang"] || (config && config.lang) || 'en';
        i18n.init({
            debug: true,
            load: 'current',
            lng: lang,
            getAsync: false, //Setting sync because we want all string loaded before continueing page load
            callBack: callbackfunc
        });
        
    };
    
    //return specific translation of one string
    translator.translate = function(s){
        
        return (i18n.t(s)) || s;
        //return ($.i18n && $.i18n.map[s]) || s;
    }
})();

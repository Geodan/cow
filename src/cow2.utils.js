window.Cow = window.Cow || {};
Cow.utils = {
    //Generate a unique id
    idgen: function(){
        //TODO: add some randomness
        return new Date().getTime().toString();
    }
};

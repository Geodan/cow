var test = function(){ 
    var mycore = new Cow.core();
    ps = mycore.projectStore();
    ps._db._init({dbname:'users'});
    p = ps._db._getRecords();
    p.done(function(r){
        console.log(r.rows);
    });
};

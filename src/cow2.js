var mycore = null;

var adduser = function(){
    s = mycore.userStore();
    var rec = new Cow.user();
    rec.inflate({_id: 2, status: 'active'});
    rec.data('mail','hoeps');
    s.addUser({source:'UI', data: rec.deflate()});
    
};

var addproject = function(){
    ps = mycore.projectStore();
    var rec2 = new Cow.project();
    rec2.inflate({_id: 2, status: 'active',data: {name: 'project1'}});
    rec2.populate();
    ps.addProject({source: 'UI', data: rec2.deflate()});
    
};

$(document).ready(function(){
    mycore = new Cow.core();
    var us = mycore.userStore();
    us.initDb();
    var promise1 = us._initRecords(); 
    //promise1.done(adduser);
    
    var ps = mycore.projectStore();
    ps.initDb();
    var promise2 = ps._initRecords();
    //promise2.done(addproject);
    
    
});

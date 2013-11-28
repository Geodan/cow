var mycore = null;

var updaterecord = function(){
    s = mycore.userStore();
    var rec = s.getUsers()[0];
    rec.data('mail','hoeps');
    s.updateUser({source:'UI', data: rec.deflate()});
    
};

var addproject = function(){
    ps = mycore.projectStore();
    var rec = new Cow.project();
    rec.inflate({_id: 1, status: 'active',data: {name: 'project1'}});
    rec.populate();
    ps.addProject({source: 'UI', data: rec.deflate()});
    
}

$(document).ready(function(){
    mycore = new Cow.core();
    var us = mycore.userStore();
    us.initDb();
    var promise1 = us._initRecords(); 
    promise1.done(updaterecord);
    
    var ps = mycore.projectStore();
    ps.initDb();
    var promise2 = ps._initRecords();
    promise2.done(addproject);
    
    
});




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
    var rec2 = new Cow.project({_id: 2});
    rec2.inflate({status: 'active',data: {name: 'project1'}});
    rec2.populate();
    var item = new Cow.item();
    item.inflate({_id: 2, status: 'active',data: {name: 'item1', dbase: ps._dbname}});
    rec2.itemStore().addItem({source: 'UI', data: item.deflate()});
    ps.addProject({source: 'UI', data: rec2.deflate()});
    
};

$(document).ready(function(){
    mycore = new Cow.core();
    //mycore.userStore().initDb();
    //var promise1 = mycore.userStore()._initRecords(); 
    //promise1.done(adduser);
    
    //mycore.projectStore().initDb();
    //var promise2 = mycore.projectStore()._initRecords();
    //promise2.done(addproject);
    
    
});

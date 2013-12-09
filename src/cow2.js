


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

var stresstest = function(){
    //Empty test database
    PouchDB.destroy('items_99', function(err, info) {
            console.log(info);
    });
    //Create project test
    var project = mycore.projects({_id: '99'})
        .data({name: 'testproject'}).sync();
    
    //Create user test
    var user = mycore.users({_id: '99'})
        .data({name: 'testuser'}).sync();
    //Add N items to project
    var item;
    var N = 101;
    for (i=1;i<N; i++){
        project.items({_id: i})
            .data('type', 'msg')
            .data('json', {'topic':'topic','text': 'blabla'});
    }
    project.itemStore().syncRecords();
    
    
};

window.onload =function(){
    /**
        Settings some defaults
    **/
            
        
};

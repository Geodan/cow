window.Cow = window.Cow || {};


function mylog(text){
    var textarea = d3.select('#console');
    textarea.append('span').html(text + '<br>');
}
function clearlog(){
    var textarea = d3.select('#console');
    textarea.html('');
}

Cow.testsuite = function(core){
    this.core = core;
};


Cow.testsuite.prototype.laptime = function(starttime){
    return  new Date() - starttime + 'ms ';
};

/**
    newsocket(url) - change socket connection
**/
Cow.testsuite.prototype.newsocket = function(){
};


Cow.testsuite.prototype.analyzeStore = function(){
    var core = this.core;
    var self = this;
    var starttime = new Date();
    core.projectStore().loaded.then(function(foo){
            mylog(self.laptime(starttime) + 'Num projects: ',core.projects().length);
            core.projects().forEach(function(d){
                d.itemStore().loaded.then(function(foo){
                    var numitems = d.items().length;
                    mylog(self.laptime(starttime) + 'Project ' + d.data('name') + ' (' + numitems + ' items)');
                });
                d.groupStore().loaded.then(function(foo){
                    var numitems = d.groups().length;
                    mylog(self.laptime(starttime) + 'Project ' + d.data('name') + ' (' + numitems + ' groups)');
                });
            });
    });
    core.userStore().loaded.then(function(foo){
        mylog(self.laptime(starttime) + 'Num users: ' + core.users().length);
    });
};


/**
    Create project, create 100 records, sync them, delete project 
**/
Cow.testsuite.prototype.lifecycle = function(){
    var core = this.core;
    var self = this;
    var starttime = new Date();
    
    mylog('Starting lifecycle test. Creating and syncing 100 items');
    core.projectStore().loaded.then(function(foo){
        var project = core.projects({_id: 'test'});
        project.data('name', 'TEST');
        project.itemStore().clear(); //remove existing items from store
        mylog('We now have ' + core.projects('test').items().length + ' items (should be 0)'); //should be 0 items
        
        project.deleted(false).sync(); //set project undeleted
        for (var i = 0;i<100;i++){ //Add 100 records
            var item = project.items({_id: i.toString()});
            item.data('tmp',(Math.random()*100).toString());
            item.data('text','Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit...');
        }
        mylog('We now have ' + core.projects('test').items().length + ' items (should be 100)'); //should be 0 items
        mylog('changing items');
        var syncpromise = project.itemStore().syncRecords(); //sync the records
        for (i = 0;i<100;i++){//Update the records 
            item = project.items(i.toString());
            item.data('tmp',(Math.random()*100).toString()).sync();
        }
        //syncpromise = project.itemStore().syncRecords(); //sync the records
        
        
        
        mylog('Clearing itemstore');
        project.itemStore().clear(); //remove items from store
        mylog('We now have ' + core.projects('test').items().length + ' items (should be 0)'); //should be 0 items
        project.itemStore().sync(); //full sync on itemstore
        mylog('Sync it back! Waiting 5 secs to sync back the 100 items');
        window.setTimeout(function(){
            mylog('We now have ' + core.projects('test').items().length + ' items (should be 100)'); //should be 100
            mylog('Clearing itemstore');
            project.itemStore().clear(); //remove items from store
            mylog('Back to ' + core.projects('test').items().length + ' items (should be 0)'); //should be 0
            mylog('Sending flushing command to peers');
            core.messenger().sendData({command: 'flushProject',projectid: 'test'}, 'command');
            project.deleted(true).sync();//set project to deleted
            mylog(self.laptime(starttime) + ' lifecycletest finished');
        },5000);
    });
};
/**
    pingtest() - logs pingtimes to all connected peers in ms
**/

Cow.testsuite.prototype.pingtest = function(){
    var self = this;
    this.core.messenger().off('command');
    this.core.messenger().on('command', function(data){
        var payload = data.payload;
        var returntime = new Date().getTime();
        var triptime = returntime - self.starttime;
        var sender = data.sender;
        mylog('PONG from ' + sender + '(' + core.peers(sender).username() + ') in ' + triptime + 'ms');
    });
    var msn = core.messenger();
    this.starttime = new Date().getTime();
    msn.sendData({command: 'ping'},'command');
};

Cow.testsuite.prototype.socketsearch = function(){
    var self=this;
    var subnet = core.socketserver().data('ip').split('.').splice(3).join('.');
    var onopen = function(i){
        return function(d){
              var url = d.target.URL;
              console.log('Connection with ' + url);
              setTimeout(function(){d.target.close();}, 1000); //d.target.close();
          };
    };
    var onmessage = function(i){
        return function(d){
            var url = d.origin;
            var data = null;
            if (d.data && typeof d.data == 'string') {
                try{
                    
                    data = JSON.parse(d.data);
                }catch(e){
                    console.warn('Error parsing JSON: ' + e);
                }
            }
            if (data && data.action == 'connected' && data.payload.key == 'test'){
                core.socketservers({_id: url, data:{protocol: 'ws', ip: (subnet+i), port:8081}}).sync();
            }
          };
    };
    
    
    for (var i = 0;i<256;i++){
          var c = new WebSocket('ws://'+subnet+'.'+i+':8081', 'connect');
          c.onopen = onopen(i); 
          c.onerror = null;
          c.onmessage = onmessage(i); 
    }
    
};

window.Cow = window.Cow || {};

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
            var laptime = new Date() - starttime + 'ms ';
            console.log(self.laptime(starttime) + 'Num projects: ',core.projects().length);
            core.projects().forEach(function(d){
                d.itemStore().loaded.then(function(foo){
                    var numitems = d.items().length;
                    console.log(self.laptime(starttime) + 'Project ',d.data('name') + ' (' + numitems + ' items)');
                });
                d.groupStore().loaded.then(function(foo){
                    var numitems = d.groups().length;
                    console.log(self.laptime(starttime) + 'Project ',d.data('name') + ' (' + numitems + ' groups)');
                });
            });
    });
    core.userStore().loaded.then(function(foo){
        console.log(self.laptime(starttime) + 'Num users: ',core.users().length);
    });
};


/**
    Create project, create 100 records, sync them, delete project 
**/
Cow.testsuite.prototype.lifecycle = function(){
    var core = this.core;
    var self = this;
    var starttime = new Date();
    core.projectStore().loaded.then(function(foo){
        var project = core.projects('test').data('name', 'TEST');
        project.deleted(false).sync();
        for (var i = 0;i<100;i++){
            var item = project.items({_id: i.toString()});
            item.data('tmp',(Math.random()*100).toString());
        }
        var syncpromise = project.itemStore().syncRecords();
        project.itemStore().clear();
        project.deleted(true).sync();
        console.log(self.laptime(starttime) + ' lifecycletest finished');
    });
};
/**
    pingtest() - logs pingtimes to all connected peers in ms
**/

Cow.testsuite.prototype.pingtest = function(){
    var self = this;
    this.core.websocket().off('command');
    this.core.websocket().on('command', function(data){
        var payload = data.payload;
        var returntime = new Date().getTime();
        var triptime = returntime - self.starttime;
        var sender = data.sender;
        console.log('PONG from ' + sender + ' in ' + triptime + 'ms');
    });
    var ws = core.websocket();
    this.starttime = new Date().getTime();
    ws.sendData({command: 'ping'},'command');
};

Cow.testsuite.prototype.syncrecords = function(){
};


Cow.testsuite.prototype.removerecords = function(){
};

Cow.testsuite.prototype.purge = function(){
};



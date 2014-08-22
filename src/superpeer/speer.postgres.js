//Use the native libpq bindings
var pg = require('pg').native;

var dbUrl = "tcp://osgis:osgis@osgis.geodan.nl/osgis2";

function testDate(onDone) {
    pg.connect(dbUrl, function(err, client) {
        client.query("SELECT gid as when FROM cbs2012.gem_2012_v1 LIMIT 10", function(err, result) {
            console.log(err);
            console.log("Row count: %d",result.rows.length);  // 1
            //console.log("Current year: %d", result.rows[0].when.getFullYear());

            onDone();
        });
    });
}

testDate();
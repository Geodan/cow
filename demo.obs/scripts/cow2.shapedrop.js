//Based on:
//https://github.com/calvinmetcalf/shapefile-js

//Alternative might be:
//https://github.com/wavded/js-shapefile-to-geojson



/** TODO
Compress the JSON (maybe http://pieroxy.net/blog/pages/lz-string/index.html)
    or: make topojson from geojson 

**/
var dropgroup;
var shapedrop_init = function(map){
     var m = map;
     dropgroup = L.layerGroup().addTo(map);
     function readerLoad() {
        if (this.readyState !== 2 || this.error) {
            return;
        }
        else {
            //worker.data(this.result, [this.result]);
            console.log(shp.parseZip(this.result));
            json = shp.parseZip(this.result);
            var newid = new Date().getTime();
            //TODO: add some checks (size, validity) before we add this to COW project
            //core.project().items(newid).data('type','featureCollection').data('featureCollection',json).sync();
            var layer = new L.GeoJSON(json).addTo(dropgroup);
            console.log('Shapefile added');
        }
    }

    function handleZipFile(file) {
        
        var reader = new FileReader();
        reader.onload = readerLoad;
        reader.readAsArrayBuffer(file);
    }

    function handleFile(file) {
    
        //m.spin(true);
        if (file.name.slice(-3) === 'zip') {
            return handleZipFile(file);
        }
        var reader = new FileReader();
        reader.onload = function() {
            var ext;
            if (reader.readyState !== 2 || reader.error) {
                return;
            }
            else {
                ext = file.name.split('.');
                ext = ext[ext.length - 1];
    
                
                worker.json([reader.result, file.name.slice(0, (0 - (ext.length + 1)))], [reader.result]);
            }
        };
        reader.readAsArrayBuffer(file);
    }
     var dragenter = function(e) {
        e.stopPropagation();
        e.preventDefault();
        m.scrollWheelZoom.disable();
    };
    
    var dragover = function(e) {
        e.stopPropagation();
        e.preventDefault();
    };
    
    var drop = function(e) {
        e.stopPropagation();
        e.preventDefault();
        m.scrollWheelZoom.enable();
        var dt = e.dataTransfer;
        var files = dt.files;
    
        var i = 0;
        var len = files.length;
        if (!len) {
            return;
        }
        while (i < len) {
            handleFile(files[i]);
            i++;
        }
    };
    var dropbox = document.getElementById("map");
    dropbox.addEventListener("dragenter", dragenter, false);
    dropbox.addEventListener("dragover", dragover, false);
    dropbox.addEventListener("drop", drop, false);
    dropbox.addEventListener("dragleave", function() {
        m.scrollWheelZoom.enable();
    }, false);
};

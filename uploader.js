var Db = require('mongodb').Db,
Connection = require('mongodb').Connection,
Server = require('mongodb').Server,
GridStore = require('mongodb').GridStore,
// BSON = require('../lib/mongodb').BSONPure;
BSON = require('mongodb').BSONNative;
var t = 0;

var fs = require('fs');
var pathToFiles = "/Users/grender/Desktop/Music/The American Dollar_AMS8/A Memory Stream/"
var filesToUpload = fs.readdirSync(pathToFiles);

var db1 = new Db('musicBase', new Server('localhost', Connection.DEFAULT_PORT, {}), {
    native_parser: true
});

db1.open(function(err, db) {
	var fileNum=9;
    for (var i = fileNum; i < fileNum+1; i++) {
        var fileIdx = i;
        var fileName = filesToUpload[i];
        var readStream = fs.createReadStream(pathToFiles + fileName, {
            'flags': 'r'
            ,
            'encoding': null
            ,
            'bufferSize': 1024 * 1024
        });
        var gridStore = new GridStore(db, "music" + fileIdx, "w");
        gridStore.open(function(err, gridStore) {
            console.log("ERR", err);
            console.log("music" + gridStore.filename + " opened");
            readStream.on('data',
            function(data) {
                gridStore.write(data,
                function(err, gridStore) {
                    console.log("ERR", err);
                });
            });
            readStream.on('end',
            function() {
                console.log("END");
                gridStore.close(function(err, result) {
                    console.log("ERR", err);
                    console.log(gridStore.filename + " written", result);
                });
            });

        });

        readStream.on('error',
        function(ex) {
            console.log("ERROR Reading file.", ex);
        });
    };
});
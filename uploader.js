var Db = require('mongodb').Db,
Connection = require('mongodb').Connection,
Server = require('mongodb').Server,
GridStore = require('mongodb').GridStore,
// BSON = require('../lib/mongodb').BSONPure;
BSON = require('mongodb').BSONNative;

var Q = require('q');

var t = 0;

var fs = require('fs');
var pathToFiles = "/Users/grender/Desktop/Music/The American Dollar_AMS8/A Memory Stream/"
var filesToUpload = fs.readdirSync(pathToFiles);

var db1 = new Db('musicBase', new Server('localhost', Connection.DEFAULT_PORT, {}), {
    native_parser: true
});

function uploadFileToBase(db, filePath, fileNameInDb) {
    var defer = Q.defer();
    var gridStore = new GridStore(db, fileNameInDb, "w");
    gridStore.open(function(err, gridStore) {
        console.log(fileNameInDb + " opened");
        if (err) defer.reject(err);
        var fileData = fs.readFileSync(filePath, 'binary');
        gridStore.write(fileData,
        function(err, gridStore) {
            if (err) defer.reject(err);
            gridStore.close(function(err, result) {
                if (err) defer.reject(err);
                defer.resolve();
                console.log(fileNameInDb + " closed");
            });
        });
    });
    return defer.promise;
}

db1.open(function(err, db) {
    var defer;
    var parentDefer = Q.defer();
    defer = parentDefer;
    for (var i = 0; i < filesToUpload.length; i++) {
        var fileName = pathToFiles + filesToUpload[i];
        (function(i) {
            defer = Q.when(defer,
            function() {
                return uploadFileToBase(db1, fileName, "music" + i);
            });
        })(i);
    };
    parentDefer.resolve();

});
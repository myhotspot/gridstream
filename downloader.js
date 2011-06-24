var Db = require('mongodb').Db,
Connection = require('mongodb').Connection,
Server = require('mongodb').Server,
GridStore = require('mongodb').GridStore,
// BSON = require('../lib/mongodb').BSONPure;
BSON = require('mongodb').BSONNative;
var t = 0;

var fs = require('fs');
var pathToFiles = "./saved/"

var db1 = new Db('musicBase', new Server('localhost', Connection.DEFAULT_PORT, {}), {
    native_parser: true
});

db1.open(function(err, db) {
    db.collection('fs.files',
    function(err, collection) {
        collection.find(function(err, cursor) {
            cursor.toArray(function(err, docs) {
				for (var i=0; i < docs.length; i++) {			
                    GridStore.read(db, docs[i].filename,docs[i].length,0,
                    function(err, data) {
                        fs.writeFileSync(pathToFiles+docs[i].filename+".mp3",data,"binary");
                    });					
				};
            });
        });
    });
});

var Connect = require('connect');
var Db = require('mongodb').Db,
Connection = require('mongodb').Connection,
Server = require('mongodb').Server,
GridStore = require('mongodb').GridStore,
// BSON = require('../lib/mongodb').BSONPure;
BSON = require('mongodb').BSONNative;


var SERVER_PORT = 12345;
var MONGO_BASE_NAME = "musicBase";
var MONGO_HOST = 'localhost';
var MONGO_PORT = Connection.DEFAULT_PORT;

var server = Connect.createServer()
.use(Connect.logger())
.use(Connect.router(function(app) {
    app.get("/", showFilesInBase);
    app.get("/play/:fileName", playIt);
}))
.use(Connect.static(__dirname + "/public"));
server.listen(SERVER_PORT);

function showFilesInBase(req, res)
 {

    }

function error404(res)
 {
    var body = 'Not found';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.statusCode = 404;
    res.end(body);
}

function error416(res) {
    var body = 'Requested Range Not Satisfiable';
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Length', body.length);
    res.statusCode = 416;
    res.end(body);
}

var db = new Db(MONGO_BASE_NAME, new Server(MONGO_HOST, MONGO_PORT, {}), {
    native_parser: true
});
db.open(function(err, db) {
    });

function parseRange(size, str) {
    var valid = true;
    var arr = str.substr(6).split(',').map(function(range) {
        var range = range.split('-')
        ,
        start = parseInt(range[0], 10)
        ,
        end = parseInt(range[1], 10);

        // -500
        if (isNaN(start)) {
            start = size - end;
            end = size - 1;
            // 500-
        } else if (isNaN(end)) {
            end = size - 1;
        }

        // Invalid
        if (isNaN(start) || isNaN(end) || start > end) valid = false;

        return {
            start: start,
            end: end
        };
    });
    return valid ? arr: undefined;
};

function playIt(req, res) {
    var filename = req.params.fileName;
    var head = 'HEAD' == req.method;
    var ranges = req.headers.range;
    /*
	GridStore.exist(db,filename,function(err,exist) {
		if(!exist)
		{
            error404(res);
            return;
        }
	});*/

    db.collection('fs.files',
    function(err, collection) {
        collection.find({
            filename: filename
        },
        function(err, cursor) {
            cursor.toArray(function(err, docs) {
                if (!docs.length)
                {
                    error404(res);
                    return;
                }
                var doc = docs[0];
                res.setHeader('Content-Length', doc.length);
                res.setHeader('Last-Modified', doc.uploadDate.toUTCString());
                res.setHeader('Content-Type', 'audio/mpeg');
                res.setHeader('Accept-Ranges', 'bytes');
                if (head) {
                    res.end();
                    return;
                }

                var offset = 0;
                var length = doc.length;
                if (ranges) {
                    var ranges = parseRange(doc.length, ranges);
                    if (ranges === undefined)
                    {
                        error416(res);
                        return;
                    }
                    length = ranges.end - ranges.start;
                    offset = ranges.start;
                }


                function writeBody(gridStore, data)
                {
                    if (gridStore.currentChunk.length() === (gridStore.currentChunk.position + 1))
                    {
                        res.end(data, 'binary');
                    } else {
                        res.write(data, 'binary');
                    }
                }

                new GridStore(db, doc.filename, "r").open(function(err, gridStore) {
                    if (offset != null) {
                        gridStore.seek(offset,
                        function(err, gridStore) {
                            gridStore.read(length,
                            function(err, data) {
                                writeBody(gridStore, data);
                            });
                        });
                    } else {
                        gridStore.read(length,
                        function(err, data) {
                            writeBody(gridStore, data);
                        });
                    }
                });



            });
        });
    });
}
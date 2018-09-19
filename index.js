#!/usr/bin/env nodejs

'use strict';
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var md5 = require('md5');
var app = express();
var dateTime = require('node-datetime');

const {ObjectId} = require('mongodb'); // or ObjectID

app.use(bodyParser.json());

const url='mongodb://homedocRW:homedocRW@51.38.234.54:27017/homedoc';
const dbName = 'homedoc';

app.get('/', function (req, res) {
    res.send("OK");
});

// Create new user in users collection
app.post('/createUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
       const db = client.db(dbName);
       var query = {
           email: req.body.email,
           password: md5(req.body.password)
       };
       db.collection('users').insertOne(query, function (err, result) {
            if (result) {
                res.send(JSON.stringify({"state": "success"}));
            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
       });
    });
});


app.post('/editUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
       const db = client.db(dbName);

    var query = {
	    _id: ObjectId(req.body.token)
       };
	var update = {
	    $set : {
		email: req.body.email,
		password: req.body.password
	    }
	};
	db.collection('users').updateOne(query, update, function (err, result) {
            if (result) {
                res.send(JSON.stringify({"state": "success"}));
            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
       });
    });
});


app.post('/getUser', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var query = {
            token: req.body.token
        };
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').findOne(query, function(err, result) {
            if (result) {
                res.send(JSON.stringify(result));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            db.close();
        });
    })
});

app.post('/usersList', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').find({}).toArray(function(err, result) {
            if (result) {
                res.send(JSON.stringify({"users": result, "state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            db.close();
        });
    })
});

app.post('/login', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var query = {
            email: req.body.email,
            password: md5(req.body.password)
        };

        var dt = dateTime.create();
        var formatted = dt.format('d-m-Y H:M:S');
        var token = req.body.email + '&'+ formatted;
        var update = {
            $set : { "token" : md5(token)
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').findOneAndUpdate(query, update,  function(err, result) {
            if (result) {

                res.send(JSON.stringify({"token": md5(token), "state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            db.close();
        });
    })
});

app.post('/logout', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var query = {
            token: req.body.token
        };
        var update = {
            $set : { "token" : ""
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').findOneAndUpdate(query, update, function(err, result) {
            if (result) {
                res.send(JSON.stringify({"state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            db.close();
        });
    })
});

app.post('/view', function (req, res) {
    res.send(req.body);
});


app.post('/delUser', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var query = {
            token: req.body.token
        };
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').deleteOne(query, function(err, result) {
            if (result) {
                res.send(JSON.stringify({"state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            db.close();
        });
    })
});

var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Example app listening at http://%s:%s", host, port)
});

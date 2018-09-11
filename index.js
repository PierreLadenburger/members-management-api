#!/usr/bin/env nodejs

'use strict';
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

const {ObjectId} = require('mongodb'); // or ObjectID

app.use(bodyParser.json());

const url='mongodb://homedocRW:homedocRW@51.38.234.54:27017/homedoc';
const dbName = 'homedoc';

app.get('/', function (req, res) {
    res.send("OK");
});

/*
app.post('/', function (req, res) {  
    MongoClient.connect(url, function(err, client) {
	const db = client.db(dbName);
	var query = {
	    username: req.body.username
	};
	console.log(req.body);
	res.setHeader('Content-Type', 'application/json; charset=UTF-8');
	db.collection('users').findOne(query, function(err, result) {
			if (result) {
			    res.send(JSON.stringify({"State": "Success"}));

			} else {
			    res.send(JSON.stringify({"State": "Error"}));
			}
			db.close();
		});
    })
});
*/

// Create new user in users collection
app.post('/createUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
       const db = client.db(dbName);
       var query = {
           email: req.body.email,
           password: req.body.password,
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

app.post('/login', function (req, res) {
        MongoClient.connect(url, function(err, client) {
	const db = client.db(dbName);
	var query = {
	    email: req.body.email,
	    password: req.body.password
	};
	res.setHeader('Content-Type', 'application/json; charset=UTF-8');
	db.collection('users').findOne(query, function(err, result) {
			if (result) {
			    res.send(JSON.stringify({"token": result._id, "state": "success"}));

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

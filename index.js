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

// Insert a user in db (email, password, firstname, lastname, dateOfBirth)
app.post('/createUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (req.body.email !== '') {
        MongoClient.connect(url, function (err, client) {
            const db = client.db(dbName);
            var dt = dateTime.create();
            var formatted = dt.format('d-m-Y H:M:S');
            var query = {
                email: req.body.email,
                password: md5(req.body.password),
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                dateOfBirth: new Date(req.body.dateOfBirth),
                creationDate: new Date(),
            };
            var checkEmail = {
                email: req.body.email
            };
            db.collection('users').findOne(checkEmail, function (err, result) {
                if (result) {
                    res.send(JSON.stringify({"state": "error", "message": "email already used"}));
                }
                else {
                    db.collection('users').insertOne(query, function (err, result) {
                        if (result) {
                            res.send(JSON.stringify({"state": "success"}));
                        } else {
                            res.send(JSON.stringify({"state": "error", "message": "insertion failed"}));
                        }
                        client.close();
                    });
                }
                client.close();
            });
        });
    } else  {
        res.send(JSON.stringify({"state": "error", "message": "bad email"}));
    }
});

app.post('/delUser', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var query = {
            token: req.body.token
        };
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').findOneAndDelete(query, function(err, result) {
            if (result.value != null) {
                res.send(JSON.stringify({"state": "success"}));

            } else {
                res.send(JSON.stringify({"state" : "error", "message" : "bad token"}));
            }
            client.close();
        });
    })
});


app.post('/editUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        var query = {
            token: req.body.token
        };
        var update = {
            $set: {
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                dateOfBirth: new Date(req.body.dateOfBirth)
            }
        };
        db.collection('users').findOneAndUpdate(query, update, function (err, result) {
            if (result.value != null) {
                res.send(JSON.stringify({"state": "success"}));
            } else {
                res.send(JSON.stringify({"state": "error", "message" : "bad token"}));
            }
            client.close();
        });
    });
});

app.post('/changePassword', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        var query = {
            token: req.body.token,
            password: md5(req.body.oldPassword)
        };

        var dt = dateTime.create();
        var formatted = dt.format('d-m-Y H:M:S');
        var token = req.body.email + '&'+ formatted;
        var update = {
            $set : { "password" : md5(req.body.newPassword)
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('users').findOneAndUpdate(query, update,  function(err, result) {
            if (result.value != null) {
                res.send(JSON.stringify({"state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error", "message" : "bad token"}));
            }
            client.close();
        });
    })
});

app.post('/getUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    if (req.body.token !== '') {

        MongoClient.connect(url, function (err, client) {
            const db = client.db(dbName);
            var query = {
                token: req.body.token
            };
            db.collection('users').findOne(query, function (err, result) {
                if (result) {
                    res.send(JSON.stringify({"userData" : result, "state" : "success"}));

                } else {
                    res.send(JSON.stringify({"state": "error", "message": "bad token"}));
                }
                client.close();
            });
        })
    }
    else {
        res.send(JSON.stringify({"state": "error", "message": "bad token"}));
    }
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
            if (result.value != null) {
                res.send(JSON.stringify({"token": md5(token), "state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            client.close();
        });
    })
});

app.post('/logout', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        MongoClient.connect(url, function(err, client) {
            var query = {
                token: req.body.token
            };
            var updateToken = {
                $unset : { "token" : ""
                }
            };
            const db = client.db(dbName);
            db.collection('users').findOneAndUpdate(query, updateToken, function(err, result) {
                if (result.value != null) {
                    res.send(JSON.stringify({"state": "success"}));

                } else {
                    res.send(JSON.stringify({"state": "error", "message": "bad token"}));
                }
                client.close();
            });
        });
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
            client.close();
        });
    })
});

app.listen(8080);

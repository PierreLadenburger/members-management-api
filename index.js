#!/usr/bin/env nodejs

'use strict';
var MongoClient = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');
var md5 = require('md5');
var app = express();
var dateTime = require('node-datetime');
var swaggerUi = require('swagger-ui-express');
var swaggerDocument = require('./swagger.json');

const {ObjectId} = require('mongodb'); // or ObjectID

app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const url='mongodb://homedocRW:homedocRW@51.38.234.54:27017/homedoc';
const dbName = 'homedoc';

function isEmptyObject(obj) {
    return !Object.keys(obj).length;
}

app.get('/', function (req, res) {
    res.send("OK");
});

app.post('/createUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var dt = dateTime.create();
            var formatted = dt.format('d-m-Y H:M:S');
            var query = {
                email: req.body.email,
                password: md5(req.body.password),
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                dateOfBirth: req.body.dateOfBirth,
                creationDate: new Date(),
                firstConnection : true
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
        }
    });
});

app.post('/delUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var query = {
                token: req.body.token
            };
            db.collection('users_token').findOne(query, function (err, result) {
                if (result) {
                    var query = {
                        _id : ObjectId(result.user_id)
                    };
                    db.collection('users').findOneAndDelete(query, function(err, result) {
                        if (result.value != null) {
                            res.send(JSON.stringify({"state": "success"}));
                        }
                        client.close();
                    });
                } else {
                    res.send(JSON.stringify({"state" : "error", "message" : "bad token"}));
                }
                client.close();
            });
        }
    })
});

app.post('/editUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            const db = client.db(dbName);
            var query = {
                token: req.body.token
            };
            var update = {
                $set: {
                    device_id: req.body.device_id
                }
            };
            db.collection('users_token').findOneAndUpdate(query, update, {returnOriginal:false} ,function (err, result) {
                if (result.value) {
                    var query = {
                        _id : ObjectId(result.value.user_id)
                    };
                    var update = {
                        $set: {
                            firstname: req.body.firstname,
                            lastname: req.body.lastname,
                            dateOfBirth: req.body.dateOfBirth,
                            height: req.body.height,
                            weight: req.body.weight,
                            medicalHistory: req.body.medicalHistory,
                            gender: req.body.gender,
                            allergies: req.body.allergies,
                            city : req.body.city,
                            firstConnection : req.body.firstConnection
                        }
                    };
                    db.collection('users').findOneAndUpdate(query, update, function (err, result) {
                        if (result.value != null) {
                            res.send(JSON.stringify({"state": "success"}));
                        }
                        client.close();
                    });
                } else {
                    res.send(JSON.stringify({"state": "error", "message" : "bad token"}));
                }
                client.close();
            });

        }
    });
});

app.post('/changePassword', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var query = {
                token: req.body.token
            };
            db.collection('users_token').findOne(query, function (err, result) {
                if (result) {
                    var query = {
                        _id : ObjectId(result.user_id),
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
                            res.send(JSON.stringify({"state": "error", "message" : "bad old password"}));
                        }
                        client.close();
                    });
                } else {
                    res.send(JSON.stringify({"state": "error", "message" : "bad token"}));
                }
                client.close();
            });
        }
    })
});

app.post('/getUser', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        MongoClient.connect(url, function (err, client) {
            const db = client.db(dbName);
            if (isEmptyObject(req.body)) {
                res.send(JSON.stringify({"state": "error", "message": "bad json"}));
            } else {
                var query = {
                    token: req.body.token
                };

                db.collection('users_token').findOne(query, function (err, result) {
                    if (result) {
                        var query = {
                            _id : ObjectId(result.user_id)
                        };
                        db.collection('users').findOne(query, function (err, result) {

                            if (result != null) {
                                res.send(JSON.stringify({"userData": result, "state": "success"}));

                            }
                            client.close();
                        });
                    } else {
                        res.send(JSON.stringify({"state": "error", "message": "bad token"}));
                    }
                    client.close();
                });
            }
        })
});

app.get('/getUser/:id', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        var query = {
            _id: ObjectId(req.params.id)
        };
        db.collection('users').findOne(query, function (err, result) {

            if (result != null) {
                res.send(JSON.stringify({"userData" : result, "state" : "success"}));

            } else {
                res.send(JSON.stringify({"state": "error", "message": "bad token"}));
            }
            client.close();
        });
    })
});

app.post('/login', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));

        } else {
            const db = client.db(dbName);
            var query = {
                email: req.body.email,
                password: md5(req.body.password)
            };

            var dt = dateTime.create();
            var formatted = dt.format('d-m-Y H:M:S');
            var token = req.body.email + '&'+ formatted;

            res.setHeader('Content-Type', 'application/json; charset=UTF-8');
            db.collection('users').findOne(query,  function(err, result) {
                if (result) {
                    var update = {
                        token : md5(token),
                        user_id : ObjectId(result._id),
                        device_id : req.body.device_id,
                        date: new Date()
                    };
                    db.collection('users_token').insertOne(update, function (err, result) {
                        res.send(JSON.stringify({"state": "success", "token": md5(token)}));
                        client.close();
                    });
                } else {
                    res.send(JSON.stringify({"state": "error", "message" : "bad login or password"}));
                }
                client.close();
            });
        }
    })
});

app.post('/logout', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        MongoClient.connect(url, function(err, client) {
            if (isEmptyObject(req.body)) {
                res.send(JSON.stringify({"state": "error", "message": "bad json"}));

            } else {
                var query = {
                    token: req.body.token
                };
                const db = client.db(dbName);
                db.collection('users_token').findOneAndDelete(query, function(err, result) {
                    if (result.value != null) {
                        res.send(JSON.stringify({"state": "success"}));

                    } else {
                        res.send(JSON.stringify({"state": "error", "message": "bad token"}));
                    }
                    client.close();
                });
            }
        });
});

app.get('/usersList', function (req, res) {
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

app.get('/doctorsList', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        db.collection('doctors').find({}).toArray(function(err, result) {
            if (result) {
                res.send(JSON.stringify({"doctors": result, "state": "success"}));

            } else {
                res.send(JSON.stringify({"state": "error"}));
            }
            client.close();
        });
    });
});

app.post('/loginDoctor', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));

        } else {
            const db = client.db(dbName);
            var query = {
                email: req.body.email,
                password: md5(req.body.password)
            };

            var dt = dateTime.create();
            var formatted = dt.format('d-m-Y H:M:S');
            var token = req.body.email + '&'+ formatted;
            var update = {
                $set : {
                    connected : true
                }
            };
            res.setHeader('Content-Type', 'application/json; charset=UTF-8');
            db.collection('doctors').findOneAndUpdate(query, update, {returnOriginal:false}, function(err, result) {
                if (result.value != null) {
                    var update = {
                        token : md5(token),
                        user_id : ObjectId(result.value._id),
                        device_id : req.body.device_id,
                        date: new Date()
                    };
                    db.collection('users_token').insertOne(update, function (err, result) {
                        res.send(JSON.stringify({"state": "success", "token": md5(token)}));
                        client.close();
                    });

                } else {
                    res.send(JSON.stringify({"state": "error", "message" : "bad login"}));
                }
                client.close();
            });
        }
    })
});

app.post('/logoutDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function(err, client) {
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));

        } else {
            var query = {
                token: req.body.token
            };

            const db = client.db(dbName);
            db.collection('users_token').findOneAndDelete(query, {returnOriginal:true}, function(err, result) {
                if (result.value != null) {
                    var updateCo = {
                        $unset : {
                            "connected" : false
                        }
                    };
                    var query = {
                        _id: ObjectId(result.value.user_id)
                    };
                    db.collection('doctors').findOneAndUpdate(query, updateCo, function (err, result) {
                        res.send(JSON.stringify({"state": "success"}));
                        client.close();
                    });

                } else {
                    res.send(JSON.stringify({"state": "error", "message": "bad token"}));
                }
                client.close();
            });
        }

    });
});

app.post('/createDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var dt = dateTime.create();
            var formatted = dt.format('d-m-Y H:M:S');
            var query = {
                email: req.body.email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                creationDate: new Date(),
                isValid : false,
                isConfirm : false,
                speciality : req.body.speciality,
                rpps: req.body.rpps,
                firstConnection : true
            };
            var checkEmail = {
                email: req.body.email
            };
            db.collection('doctors').findOne(checkEmail, function (err, result) {
                if (result) {
                    res.send(JSON.stringify({"state": "error", "message": "email already used"}));
                }
                else {
                    db.collection('doctors').insertOne(query, function (err, result) {
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
        }
    });
});

app.post('/confirmDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        var query = {
            _id : ObjectId(req.body.doctorId),
        };
        var update = {
            $set : {
                isConfirm : true,
                accessCode: Math.floor(1000 + Math.random() * 9000)
            }
        };
        db.collection('doctors').findOneAndUpdate(query, update, function (err, result) {
            if (result.value != null) {
                res.send(JSON.stringify({"state": "success"}));
            } else {
                res.send(JSON.stringify({"state": "error", "message" : "bad id"}));
            }
            client.close();
        });
    });
});

app.post('/validDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        var query = {
            email : req.body.email,
            accessCode: parseInt(req.body.accessCode)
        };
        var update = {
            $set : {
                accessCode : null,
                isValid : true
            }
        };
        db.collection('doctors').findOneAndUpdate(query, update,  {returnOriginal:false}, function (err, result) {
            if (result.value != null) {
                res.send(JSON.stringify({"state": "success", "doctorId" : result.value._id}));
            } else {
                res.send(JSON.stringify({"state": "error", "message" : "bad accessCode"}));
            }
            client.close();
        });
    });
});

app.post('/setPasswordDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        console.log(req.body);
        var query = {
              _id : ObjectId(req.body.doctorId)
        };
        var update = {
            $set : {
                password : md5(req.body.password)
            }
        };
        db.collection('doctors').findOneAndUpdate(query, update, function (err, result) {
            if (result.value != null) {
                res.send(JSON.stringify({"state": "success"}));
            } else {
                res.send(JSON.stringify({"state": "error", "message" : "bad doctorId"}));
            }
            client.close();
        });
    });
});

app.post('/getDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var query = {
                token: req.body.token
            };
            db.collection('users_token').findOne(query, function (err, result) {
               if (result) {
                   var query = {
                       _id : ObjectId(result.user_id)
                   };
                   db.collection('doctors').findOne(query, function (err, result) {
                       if (result != null) {
                           res.send(JSON.stringify({"doctorData" : result, "state" : "success"}));

                       }
                       client.close();
                   });
               } else {
                   res.send(JSON.stringify({"state": "error", "message": "bad token"}));
               }
               client.close();
            });
        }
    })
});

app.get('/getDoctor/:id', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        var query = {
            _id: ObjectId(req.params.id)
        };
        db.collection('doctors').findOne(query, function (err, result) {

            if (result != null) {
                res.send(JSON.stringify({"doctorData" : result, "state" : "success"}));

            } else {
                res.send(JSON.stringify({"state": "error", "message": "bad token"}));
            }
            client.close();
        });
    })
});

app.get('/getConnectedDoctors', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        const db = client.db(dbName);
        db.collection('doctors').find({connected : true}).toArray(function (err, result) {
            if (result != null) {
                res.send(JSON.stringify({"connected" : result, "state" : "success"}));

            } else {
                res.send(JSON.stringify({"state": "error", "message": "bad token"}));
            }
            client.close();
        });
    })
});

app.post('/editDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function (err, client) {
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            const db = client.db(dbName);
            var query = {
                token: req.body.token
            };
            var update = {
                $set: {
                    device_id: req.body.device_id
                }
            };
            db.collection('users_token').findOneAndUpdate(query, update, {returnOriginal:false} ,function (err, result) {
                if (result.value) {
                    var query = {
                        _id: ObjectId(result.value.user_id)
                    };
                    var update = {
                        $set: {
                            firstname: req.body.firstname,
                            lastname: req.body.lastname,
                            dateOfBirth: req.body.dateOfBirth,
                            city : req.body.city,
                            firstConnection : req.body.firstConnection
                        }
                    };
                    db.collection('doctors').findOneAndUpdate(query, update, function (err, result) {
                        if (result.value != null) {
                            res.send(JSON.stringify({"state": "success"}));
                        }
                        client.close();
                    });
                } else {
                    res.send(JSON.stringify({"state": "error", "message" : "bad token"}));
                }
                client.close();
            });


        }
    });
});

app.post('/changePasswordDoctor', function (req, res) {
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var query = {
                token: req.body.token
            };
            db.collection('users_token').findOne(query, function (err, result) {
                if (result) {
                    var query = {
                        _id: result.user_id,
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
                    db.collection('doctors').findOneAndUpdate(query, update,  function(err, result) {
                        if (result.value != null) {
                            res.send(JSON.stringify({"state": "success"}));
                        } else {
                            res.send(JSON.stringify({"state": "error", "message" : "bad old password"}));
                        }
                        client.close();
                    });
                } else {
                    res.send(JSON.stringify({"state": "error", "message" : "bad token"}));
                }
                client.close();
            });

        }
    })
});

app.post('/delDoctor', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);
        if (isEmptyObject(req.body)) {
            res.send(JSON.stringify({"state": "error", "message": "bad json"}));
        } else {
            var query = {
                token: req.body.token
            };
            db.collection('users_token').findOne(query, function (err, result) {
                if (result) {
                    var query = {
                        _id : ObjectId(result.user_id)
                    };
                    db.collection('doctors').findOneAndDelete(query, function(err, result) {
                        if (result.value != null) {
                            res.send(JSON.stringify({"state": "success"}));
                        }
                        client.close();
                    });
                }  else {
                    res.send(JSON.stringify({"state" : "error", "message" : "bad token"}));
                }
                client.close();
            });
        }
    })
});
app.listen(8080);

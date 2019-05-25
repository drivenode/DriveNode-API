var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');
var async = require("async");
var Db = require("../db");
var Token = require("./token");
var User = mongoose.model("user");
var dbHelper = require("./dbHelper")
var Ad = require("./ad.js");
var TwoFA = require("./twofa");

var login = (username, password, cb) => {
    console.log("local Login")
    async.waterfall([
        function (next) {
            let populateSelect = 'groupName files dir changePwd createUser createGroup defaultStorage listUser activate';

            User.findOne({
                username: username
            }).populate('group', populateSelect).exec(
                function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        if (data) {
                            if (data.activate) {
                                console.log("data.activate" + data);
                                next(null, data);
                            } else {
                                next("Account Deactivated", null)
                            }
                        } else {
                            cb("Invalid username or password", null);
                        }
                    }
                }
            );
        }, function (data, next) { //check password
            console.log("password validation" + data);
            var salt = data.salt;
            var pwd = data.password;
            bcrypt.compare(Buffer.from(password, 'base64').toString(), pwd).then(function (res) {
                if (res) {
                    var json = {};
                    json.msg = "Login Success";
                    json.userId = data._id
                    json.group = data.group;
                    json.name = data.name;
                    json.isAdmin = (data.group.createUser || data.group.createGroup || data.group.listList) ? true : false;
                    next(null, json);
                } else {
                    cb("Invalid username or password", null);
                }
            });
        },
        (json, cb) => {
            console.log("TwoFA" + json);
            TwoFA.Check(json.userId, (res) => {
                if (res) {
                    json.TwoFA = true;
                    cb(null, json);
                } else {
                    json.TwoFA = false;
                    cb(null, json);
                }
            })
        },
        (json, next) => { //Gen token
            if (json && json.TwoFA) {
                Token.GenTotpToken(json.userId, json.username, json.email, (err, data) => {
                    if (err) {
                        cb(err, null);
                    } else {
                        json.token = data;
                        cb(null, json);
                    }
                })
            } else if (json && !json.TwoFA) {
                Token.GetToken(json, function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        json.token = data;
                        cb(null, json);
                    }
                });
            }
            else {
                cb("Error", null);
            }
        }
    ], function (err, data) {

        cb(err, data);
    });
};

var adLogin = (username, password, cb) => {
    console.log("AD Login")
    async.waterfall([
        function (next) {
            let populateSelect = 'groupName files dir changePwd createUser createGroup defaultStorage listUser activate';

            User.findOne({
                username: username
            }).populate('group', populateSelect).exec(
                function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        if (data) {
                            if (data.activate) {
                                next(null, data);
                            } else {
                                next("Account Deactivated", null)
                            }
                        } else {
                            cb("Invalid username or password", null);
                        }
                    }
                }
            );
        }, function (data, next) { //check password
            Ad.Auth(username, Buffer.from(password, 'base64').toString(), (err, res) => {
                if (res) {
                    var json = {};
                    json.msg = "Login Success";
                    json.userId = data._id
                    json.group = data.group;
                    json.name = data.name;
                    json.isAdmin = (data.group.createUser || data.group.createGroup || data.group.listList) ? true : false;
                    next(null, json);
                } else {
                    cb("Invalid username or password", null);
                }
            })
        }, function (json, next) { //Gen token
            if (json) {
                Token.GetToken(json, function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        json.token = data;
                        next(null, json);
                    }
                });
            } else {
                cb("Error", null);
            }
        },
        (json, cb) => {
            TwoFA.Check(json.userId).then(data => {
                json.twofa = data;
                cb(null, json)
            })
        }
    ], function (err, data) {
        cb(err, data);
    });
};

var checkActivate = (uid, cb) => {
    if (uid) {
        dbHelper.List('user', { _id: uid }, '_id username activate', null, null, true, (err, data) => {
            if (err) {
                cb(err, null)
            } else {
                if (data && data.activate == true) {
                    cb(null, true)
                } else {
                    cb(null, false)
                }
            }
        })
    } else {
        cb("Empty User ID", null)
    }
}

var checkPermission = function (req, res, next) {
    var token = null;
    if (req.body.token) {
        token = req.body.token;
    }
    if (req.query.token) {
        token = req.query.token;
    }
    if (res.getHeader("token")) {
        token = res.getHeader("token");
    }
    var permission = req.permission;
    async.waterfall([
        function (cb) {
            if (token && permission) {
                Token.VerifyToken(token, function (err, data) {
                    if (err) {
                        //next("Invalid Token",null);
                        res.status(401).json({ success: false, msg: err });
                    } else {
                        req.userId = data.userId;
                        cb(null, data.group);
                    }
                });
            } else {
                //next("Empty token or permission provide",null);
                res.status(401).json({ success: false, msg: "Empty token or permission provide" });
            }
        }, function (data, cb) {
            var valid = false;
            for (var attributename in data) {
                for (var permissionData in permission) {
                    if (!valid) {
                        if (permissionData == "files" || permissionData == "dir") {
                            for (var a in permission[permissionData]) {
                                for (var b in data[attributename]) {
                                    if (a == b && permission[permissionData][a] == data[attributename][b]) {
                                        valid = true;
                                    }
                                }
                            }
                        }
                        if (permissionData == attributename && data[attributename] == permission[permissionData]) {
                            valid = true;
                        }
                    }
                }
            }
            cb(null, valid);
        }, function (data, cb) {
            if (data) {
                return next();
            } else {
                //next("No permission", null);
                res.status(401).json({ success: false, msg: "No permission" });
            }
        }
    ], function (err, data) {
        next(err, data);
    });
};

var isAuthenticated = function (req, res, next) {
    if (req.body.token || req.param('token')) {
        var token = "";
        if (req.body.token) {
            token = req.body.token;
        } else {
            token = req.param('token');
        }
        Token.VerifyToken(token, function (err, data) {
            if (err) {
                res.status(401).json({ success: false, msg: "Invalid Token" });
            } else {
                req.userId = data.userId;
                return next();
            }
        });
    } else {
        res.status(401).json({ success: false, msg: "Invalid Token" });
    }
};

let isAuthenticatedTotp = (req, res, next) => {
    if (req.body.totptoken || req.param('totptoken')) {
        var token = "";
        if (req.body.totptoken) {
            token = req.body.totptoken;
        } else {
            token = req.param('totptoken');
        }

        Token.VerifyTotpToken(token, (err, data) => {
            if (err) {
                res.status(404).json(err);
            } else {
                next();
            }
        })
    } else {
        res.status(401).json({ success: false, msg: "Invalid Token" });
    }
}

var addBackList = (req, res, next) => {
    if (req.body.token || req.param('token')) {
        var token = "";
        if (req.body.token) {
            token = req.body.token;
        } else {
            token = req.param('token');
        }
        Token.BlackListAdd(token, (err, data) => {

        })
    } else {
        res.status(401).json({ success: false, msg: "Invalid Token" });
    }
}

var checkAdmin = function (req, res, next) {
    if (req.body.token || req.param('token')) {
        var token = "";
        if (req.body.token) {
            token = req.body.token;
        } else {
            token = req.param('token');
        }
        Token.VerifyToken(token, function (err, data) {
            if (err) {
                res.status(401).json({ success: false, msg: "Invalid Token" });
            } else {
                if (data && (data.createUser || data.createGroup)) {
                    return next();
                } else {
                    res.status(401).json({ success: false, msg: "No Permission" });
                }
            }
        });
    } else {
        res.status(401).json({ success: false, msg: "Invalid Token" });
    }
};

var setPermission = function (permission) {
    return function (req, res, next) {
        req.permission = permission;
        next();
    };
};

var pwdReset = (uid, cb) => {

}

let totpAuth = (uid, cb) => {
    async.waterfall([
        (next) => {
            let populateSelect = 'groupName files dir changePwd createUser createGroup defaultStorage listUser activate';
            User.findOne({
                _id: uid
            }).populate('group', populateSelect).exec(
                function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        if (data) {
                            if (data.activate) {
                                console.log("data.activate" + data);
                                next(null, data);
                            } else {
                                next("Account Deactivated", null)
                            }
                        } else {
                            cb("Invalid username or password", null);
                        }
                    }
                }
            );
        }, (data, next) => {
            var json = {};
            json.msg = "Login Success";
            json.userId = data._id
            json.group = data.group;
            json.name = data.name;
            json.isAdmin = (data.group.createUser || data.group.createGroup || data.group.listList) ? true : false;
            console.log("json: " + json);
            Token.GetToken(json, function (err, data) {
                if (err) {
                    cb(err, null);
                } else {
                    json.token = data;
                    cb(null, json);
                }
            });
        }
    ], (err, data) => {
        cb(err, data);
    })




}

module.exports.Login = login;
module.exports.IsAuthenticated = isAuthenticated;
module.exports.CheckPermission = checkPermission;
module.exports.CheckAdmin = checkAdmin;
module.exports.SetPermission = setPermission;
module.exports.AddBlackList = addBackList;
module.exports.CheckActivate = checkActivate
module.exports.AdLogin = adLogin;
module.exports.IsAuthenticatedTotp = isAuthenticatedTotp;
module.exports.TotpAuth = totpAuth;
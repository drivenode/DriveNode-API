var mongoose = require("mongoose");
var bcrypt = require('bcryptjs');
var async = require("async");
var randomize = require('randomatic');
var Db = require("../db");
var Token = require("./token");
var User = mongoose.model("user");
var dbHelper = require('./dbHelper');
var mail = require("./mail")
var token = require("./token");

var listUser = function (json, next) {
    if (json && json.scope) {
        let populateSelect = 'groupName files dir changePwd createUser createGroup defaultStorage';
        let select = "_id username name email createDT space group groupName files dir changePwd createUser createGroup defaultStorage activate";
        let scope = json.scope;
        Token.VerifyToken(json.token, function (err, data) {
            if (scope == 'all' && data.group.groupName == 'admin') {
                User.find({}).select(select).populate('group', populateSelect).exec(
                    function (err, data) {
                        next(err, data);
                    }
                );
            } else {

                if (data && data.group) {
                    User.find({ group: data.group._id }).populate('group', populateSelect).select(select).exec(
                        function (err, data) {
                            next(err, data);
                        }
                    );
                } else {
                    next("", null);
                }
            }
        });

    } else {
        next("No scope", null);
    }
};

let listUsers = (select, populate = '', populateSelect = '', cb) => {
    select = "_id username";
    dbHelper.List("user", {}, select, populate, populateSelect, false, (err, data) => {
        if (err) {
            cb(err, null);
        } else {
            cb(null, data)
        }
    })

}

var listUserDetail = (uid, cb) => {
    if (uid) {
        var json = {}
        json._id = uid
        dbHelper.List('user', json, "username email group name activate", "group", "_id groupName", true, (err, data) => {
            if (err) {
                cb(err, null)
            } else {
                cb(null, data)
            }
        })
    } else {
        cb("Invalid User ID", null)
    }
}

var createUser = function (json, next) {
    if (json) {
        async.waterfall([
            function (cb) {
                validateNewUser(json, function (err, data) {
                    if (err) {
                        next({
                            msg: err
                        }, null);
                    } else if (data) {
                        cb(null, data);
                    }
                });
            },
            function (data, cb) {
                ckDuplicate(json.username, json.email, function (err, data) {
                    if (err) {
                        next({
                            msg: err
                        }, null);
                    } else {
                        console.log("ckDuplicate");
                        cb(null, data);
                    }
                });
                json.password = Buffer.from(json.password, 'base64').toString()
            },
            function (data, cb) {
                var newUser = new User();

                encryptPassword(json.password, function (err, data) {
                    console.log("new User" + err + " data:" + data);
                    if (err) {
                        next(err, null);
                    } else {
                        console.log("encryptPassword" + data.hash);
                        newUser.password = data.hash;
                        newUser.salt = data.salt;
                        cb(null, newUser);
                    }
                });


            },
            function (newUser, cb) {
                newUser.username = json.username;
                newUser.email = json.email;
                newUser.createDT = new Date();
                newUser.updateDT = new Date();
                newUser.admin = json.permission;
                newUser.group = json.group;
                newUser.space = json.space; //in MegaBytes if null than follow group
                newUser.name = json.name;
                newUser.activate = json.activate;
                newUser.save(function (err, data) {
                    cb(err, data);
                });
            }
        ], function (err, data) {
            if (err) {
                next({
                    msg: err
                }, null);
            } else {
                next(null, {
                    msg: data
                });
            }
        });
    } else {
        next("Please enter the required information", null);
    }
};

var validateNewUser = function (json, cb) {
    //console.log(json);
    if (json) {
        if (!json.username) {
            console.log("username");
            cb("Empty Username", null);
        }
        if (!json.password) {
            console.log("password");
            cb("Empty Password", null);
        }
        if (!json.confirmPwd) {
            cb("Empty Confirm Password", null);
        }
        if (json.password !== json.confirmPwd) {
            cb("Empty Password and confirm password does not mach!", null);
        }
        if (!json.group) {
            cb("Invalid Group", null);
        }
        if (!json.email) {
            cb("Invalid email", null);
        }

        if (json && json.username && json.password && json.confirmPwd && json.group && json.email) {
            cb(null, true);
        } else {
            cb("Invalide user information", null);
        }
    } else {
        console.log("Invalid New User");
        cb("Invalid New User", null);
    }
};

var ckDuplicate = function (username, email, cb) {
    if (username && email) {
        async.waterfall([
            function (next) {
                User.find({
                    username: username
                }, function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        if (data && data.length > 0) {
                            cb("Duplicate Username", null);
                        } else {
                            next(null, true);
                        }
                    }
                });
            },
            function (data, next) {
                User.find({
                    email: email
                }, function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        if (data && data.length > 0) {
                            cb("Duplicate Email", null);
                        } else {
                            next(null, true);
                        }
                    }
                });
            }
        ], function (err, data) {
            cb(err, data);
        });


    } else {
        cb("Empty Username", null);
    }
};

var encryptPassword = function (password, cb) {
    bcrypt.genSalt(10, function (err, salt) {
        if (salt) {
            bcrypt.hash(password, salt, function (err, hash) {
                // Store hash in your password DB.
                var json = {};
                json.hash = hash;
                json.salt = salt;

                cb(err, json);
            });
        } else {
            cb(err, null);
        }
    });
};

var checkUserAdmin = function (next) {
    User.find({ username: 'admin' }, function (err, data) {
        console.log("checkUserAdmin:" + data.length)
        if (data.length > 0) {
            next(true); //exist
        } else {
            next(false); //Not Exist
        }

    })
}

var getProfile = (uid, next) => {
    dbHelper.List('user', { _id: uid }, "username email createDT updateDT name", "group", "defaultStorage groupName", true, (err, data) => {
        next(err, data);
    })
}

var changePassword = (uid, oldPwd, newPwd, conPwd, isReset = false, next) => {
    async.waterfall([
        (cb) => { //validation
            if (newPwd == conPwd) {
                dbHelper.List('user', { _id: uid }, 'username password salt', null, null, true, (err, data) => {
                    if (err) {
                        next(err, null)
                    } else if (data && data.username && data.password && data.salt) {
                        cb(null, data);
                    } else {
                        next("Cannot find user (" + uid + ")", null);
                    }
                });
            } else {
                next("Password not match", null);
            }
        },
        (data, cb) => {
            if (!isReset) {
                var pwd = data.password;
                bcrypt.compare(Buffer.from(oldPwd, 'base64').toString(), pwd).then(function (res) {
                    if (res) {
                        cb(null, true);
                    } else {
                        next("Invalid username or password", null);
                    }
                });
            } else {
                cb(null, true);
            }
        },
        (data, cb) => {
            if (data) {
                newPwd = Buffer.from(newPwd, 'base64').toString()
                encryptPassword(newPwd, function (err, enData) {
                    if (err) {
                        next(err, null);
                    } else {
                        let json = {};
                        json.password = enData.hash;
                        json.salt = enData.salt;
                        cb(null, json);
                    }
                });
            } else {
                next("Error Pwd change", null)
            }
        },
        (json, cb) => {
            dbHelper.Update('user', { _id: uid }, json, (err, data) => {
                if (err) {
                    next(err, null);
                } else {
                    cb(null, true);
                }
            })
        }
    ], (err, data) => {
        next(err, data);
    })
}

var editUser = (uid, email, group, name, activate, cb) => {
    if (uid) {
        let json = {};
        if (email) {
            json.email = email;
        }
        if (group) {
            json.group = group;
        }
        if (name) {
            json.name = name;
        }
        if (activate != null) {
            json.activate = activate;
        }
        console.log("json:" + JSON.stringify(json));
        dbHelper.Count('user', { email: email }, (err, count) => {
            if (count > 0) {
                dbHelper.List('user', { email: email }, "_id email", null, null, true, (err, listCount) => {
                    if (err) { }
                    else {
                        if (listCount._id == uid) {
                            dbHelper.Update('user', { _id: uid }, json, (err, data) => {
                                if (err) {
                                    cb(err, null)
                                } else {
                                    cb(null, 'Updated User');
                                }
                            })
                        } else {
                            cb("Email duplication", null)
                        }
                    }
                })
            } else {
                dbHelper.Update('user', { _id: uid }, json, (err, data) => {
                    if (err) {
                        cb(err, null)
                    } else {
                        cb(null, 'Updated User');
                    }
                })
            }
        })
    } else {
        cb("Invalid User ID", null)
    }
}

var getEmailByUsername = (username, email, cb) => {
    dbHelper.List('user', { username: username, email: email }, "_id email", null, null, true, (err, data) => {
        if (err) {
            cb(err, null);
        } else {
            cb(null, data);
        }
    })
}

var resetPwd = (username, email, next) => {
    async.waterfall([
        (cb) => {
            getEmailByUsername(username, email, (err, data) => {
                if (err) {
                    cb(err, null);
                } else if (data) {
                    cb(null, data);
                } else {
                    cb("Invalid User", null)
                }
            })
        },
        (data, cb) => {
            data.newpwd = randomize('*', 10);
            cb(null, data)
        },
        (data, cb) => {
            token.GenResetPwdToken(data._id, "", data.email, (tokenerr, tk) => {
                if (tokenerr) {
                    cb(tokenerr, null)
                } else {
                    data.tk = tk;
                    cb(null, data)
                }
            })
        },
        (data, cb) => {
            encryptPassword(data.newpwd, function (err, enData) {
                if (err) {
                    console.log("err-enc:" + err)
                    next(err, null);
                } else {
                    let json = {};
                    json.password = enData.hash;
                    json.salt = enData.salt;
                    dbHelper.Update('user', { username: username, email: data.email }, { password: enData.hash, salt: enData.salt }, (err, updateRes) => {
                        console.log("err:" + err)
                        console.log("data-updateRes:" + updateRes)
                        if (err) {
                            cb(err, null);
                        } else {
                            cb(null, data);
                        }
                    })
                }
            });
        },
        (data, cb) => {
            let tk = data.tk;
            let mailJson = {
                from: 'admin@driveNode.com', // sender address
                to: data.email, // list of receivers
                subject: "DriveNode Reset Password", // Subject line
                //text: "", // plain text body
                html: "<b>DriveNode Reset Password</b><p>Password reseted as follow: " + data.newpwd + "</p>" // html body
            }
            mail.SendEmail(mailJson);
            cb(null, "success");

        }
    ], (err, data) => {
        if (err) {
            next(err, null);
        } else {
            next(null, data);
        }
    });
}



module.exports.CheckAdmin = checkUserAdmin;
module.exports.CreateUser = createUser;
module.exports.ListUser = listUser;
module.exports.GetProfile = getProfile;
module.exports.ChangePassword = changePassword;
module.exports.EditUser = editUser;
module.exports.ListUserDetail = listUserDetail;
module.exports.ResetPwd = resetPwd;
module.exports.ListUsers = listUsers;
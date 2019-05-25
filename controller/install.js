let async = require("async");
let User = require("../controller/user");
let Group = require("../controller/group");
let dbHelper = require("../controller/dbHelper");

var init = function (password, confirmPwd, email, next) {
    async.waterfall([
        function (cb) {
            if (password != confirmPwd) {
                next("Password are not match", null);
            } else {
                cb(null, true);
            }
        }, function (data, cb) { //check group
            if (data) {
                Group.CheckGroup(function (err, data) {
                    if (err) {
                        next(err, null);
                    } else {
                        cb(null, data);
                    }
                });
            } else {
                cb("Password are not match", null);
            }
        }, function (data, cb) {
            console.log("waterfall:" + data);
            if (data) {
                let json = {};
                json.username = "admin";
                json.password = Buffer.from(password).toString('base64');
                json.confirmPwd = Buffer.from(confirmPwd).toString('base64');
                json.email = email;
                json.group = data;
                json.name = "admin";

                User.CreateUser(json, function (err, data) {
                    if (err) {
                        cb(err, null);
                    } else {
                        cb(null, true);
                    }
                });
            } else {
                cb("Cannot find Group", null);
            }
        }
    ], function (err, data) {
        next(err, data);
    });
}

let checkInit = (cb) => { //return boolean
    dbHelper.Count("user", { username: "admin" }, (err, count) => {
        if (err) {
            cb(err, null);
        } else if (count > 0) {
            console.log("CheckInit" + count)
            cb(null, false)
        } else {
            cb(null, true)
        }
    })
}

module.exports.Init = init;
module.exports.CheckInit = checkInit;
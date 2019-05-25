var fs = require("fs");
var jwt = require('jsonwebtoken');
var async = require('async');
var config = require('./config');
var dbHelper = require("./dbHelper")
var auth = require('./auth');
var moment = require("moment");

var getToken = function (payload, cb) {
    console.log(config);
    var cert = fs.readFileSync(config.getConfig.config.tokenPrivateKeyPath);
    var expire = config.getConfig.config.tokenExpire;
    cb(null, jwt.sign(payload, cert, { algorithm: 'RS256', expiresIn: expire + "h" }));
}

var verifyToken = function (token, next) {
    async.waterfall([
        (cb) => {
            dbHelper.Count("blacklist", { token: token }, (err, count) => {
                if (count <= 0) {
                    var cert = fs.readFileSync(config.getConfig.config.tokenPublicKeyPath);  // get public key
                    cb(null, cert);
                } else {
                    cb("BlackList", null)
                }
            })
        }, (cert, cb) => {
            jwt.verify(token, cert, { algorithm: 'RS256' }, function (err, decoded) {
                cb(err, decoded);
            });
        }, (decoded, cb) => {
            console.log(decoded);
            if (decoded && decoded.userId) {
                auth.CheckActivate(decoded.userId, (err, resCheckAct) => {
                    if (resCheckAct == true) {
                        cb(null, decoded);
                    } else if (resCheckAct == false) {
                        cb("Account Deacrtivate", null)
                    }
                })
            } else {
                cb("Cannot decode", null)
            }
        }
    ], (err, data) => {
        next(err, data);
    })
    console.log("verifying token");

};

var blackListAdd = (token, cb) => {
    console.log("Blacklist Token")
    dbHelper.Add("blacklist", { token: token }, (err, data) => {
        cb(err, data)
    })
}

var blackListRemove = (cb) => {
    let json = {};
    json.createDate = { $lt: new moment().add(-1, 'days') };
    dbHelper.Delete('blacklist', json, (err, data) => {
        if (err) {
            cb(err, null);
        } else {
            cb(null, "BlackList Remove from Database success");
        }
    })
}

var genResetPwdToken = (uid, username, email, cb) => {
    let payload = { uid: uid, username: username, email: email };
    console.log(config);
    var cert = fs.readFileSync(config.getConfig.config.resetPwdTokenPrivateKeyPath);
    var expire = 0.5;

    cb(null, jwt.sign(payload, cert, { algorithm: 'RS256', expiresIn: expire + "h" }));
}

var verifyResetPwdToken = (token, cb) => {
    async.waterfall([
        (cb) => {
            var cert = fs.readFileSync(config.getConfig.config.resetPwdTokenPublicKeyPath);  // get public key
            jwt.verify(token, cert, { algorithm: 'RS256' }, function (err, decoded) {
                cb(err, decoded);
            });
        }, (decoded, cb) => {
            console.log(decoded);
            if (decoded && decoded.uid) {
                cb(null, decoded);
            } else {
                cb("Cannot decode", null)
            }
        }
    ], (err, data) => {
        next(err, data);
    })
    console.log("verifying token");
}

var genTotpToken = (uid, username, email, cb) => {
    let payload = { uid: uid, username: username, email: email };
    console.log(config);
    //var cert = fs.readFileSync(config.getConfig.config.totpTokenPrivate);
    var expire = 0.25;

    cb(null, jwt.sign({ uid: uid, username: username, email: email }, config.getConfig.config.totpTokenSec, { expiresIn: expire + "h" }));
}

var verifyTotpToken = (token, next) => {
    async.waterfall([
        (cb) => {
            var cert = fs.readFileSync(config.getConfig.config.totpTokenPublic);  // get public key
            jwt.verify(token, config.getConfig.config.totpTokenSec, function (err, decoded) {
                cb(err, decoded);
            });
        }, (decoded, cb) => {
            console.log(decoded);
            if (decoded && decoded.uid) {
                cb(null, decoded);
            } else {
                cb("Cannot decode", null)
            }
        }
    ], (err, data) => {
        next(err, data);
    })
    console.log("verifying token");
}

module.exports.GetToken = getToken;
module.exports.VerifyToken = verifyToken;
module.exports.BlackListAdd = blackListAdd;
module.exports.BlackListRemove = blackListRemove;
module.exports.GenResetPwdToken = genResetPwdToken;
module.exports.VerifyResetPwdToken = verifyResetPwdToken;
module.exports.GenTotpToken = genTotpToken;
module.exports.VerifyTotpToken = verifyTotpToken;
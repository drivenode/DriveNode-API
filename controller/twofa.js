let qrcode = require("qrcode");
var otplib = require('otplib');
var async = require("async");
var dbHelper = require('../controller/dbHelper');
var Auth = require("../controller/auth");

async function generateTokenSaveUser(uid) { //TOTP

}

let generateTotpSecretByUid = (uid, next) => { //TOTP
    const secret = otplib.authenticator.generateSecret();
    dbHelper.List("twofa", { uid: uid }, null, null, null, false, (err, data) => {
        if (data && data.length > 0) {
            next({ success: false, msg: "Time-based One-Time Password set already.", data: null }, null);
        } else {
            dbHelper.List('user', { _id: uid }, "username", null, null, true, (err, userRes) => {
                let user = userRes.username;
                const service = 'DriveNode';
                const otpauth = otplib.authenticator.keyuri(
                    encodeURIComponent(user), encodeURIComponent(service), secret);

                qrcode.toDataURL(otpauth, (err, imageUrl) => {
                    if (err) {
                        console.log('Error with QR');
                        return;
                    } else {
                        dbHelper.Add("twofa", { uid: uid, type: "TOTP", secret: secret, image: imageUrl }, (err, twofaData) => {
                            if (err) {
                                next("Error", null);
                            } else {
                                console.log(imageUrl);
                                next(null, { success: true, msg: "Use the following secret.", data: { secret: secret, image: imageUrl } });
                            }
                        })
                    }
                });
            })
        }
    })
}

let getSecret = (uid, next) => {
    dbHelper.List("twofa", { uid: uid }, null, null, null, false, (err, data) => {
        if (err) {
            next(err, null);
        } else if (data.length > 0) {
            next(null, { success: true, msg: "Use the following secret.", data: { secret: data[0].secret, image: data[0].image } });
        } else {
            next(null, { success: false, msg: "Does not have TFA", data: {} });
        }
    })
}

function validate(token, uid, next) { //TOTP
    async.waterfall([
        (cb) => {
            dbHelper.List("twofa", { uid: uid }, null, null, null, false, (err, data) => {
                if (err) {
                    cb({ success: false, enable: true, msg: "error" }, null);
                } else if (data.length > 0) {
                    const res = otplib.authenticator.check(token, data[0].secret);
                    console.log("res:" + res);
                    cb(null, { success: res, enable: true, msg: "success" });
                } else if (data.length <= 0) {
                    cb({ success: false, enable: false, msg: "twofaNotStart" }, null);
                } else {
                    cb({ success: false, enable: true, msg: "Invalid token" }, null);
                }
            })
        }, (data, cb) => {
            console.log("isValid" + data);
            console.log("uid" + uid);
            if (data && data.success) {

                Auth.TotpAuth(uid, (err, res) => {
                    cb(err, res);
                })
            } else {
                cb({ success: false, enable: true, msg: "Invalid token" }, null);
            }
        }

    ], (err, data) => {
        console.log(err);
        next(err, data);
    })

}

let check = (uid, cb) => {
    dbHelper.List("twofa", { uid: uid }, null, null, null, false, (err, data) => {
        if (err) {
            cb(false);
        } else if (data.length > 0) {
            cb(true);
        } else if (data.length <= 0) {
            cb(false);
        } else {
            cb(false);
        }
    })
}

module.exports.GenNewToken = generateTokenSaveUser;
module.exports.GenNewTotpSecret = generateTotpSecretByUid;
module.exports.Validate = validate;
module.exports.GetSecret = getSecret;
module.exports.Check = check;
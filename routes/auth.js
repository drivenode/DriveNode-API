let express = require("express");
let router = express.Router();
var Auth = require("../controller/auth");
var Group = require("../controller/group");
var Config = require("../controller/config");
let Tfa = require("../controller/twofa");

router.post("/login", function (req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    if (req.body.username && req.body.password && req.body.username != "" && req.body.password != "") {
        if (Config.getConfig.config.authMethod == 'adfs' && req.body.username != 'admin') {
            console.log("ADFS")
            Auth.AdLogin(username, password, function (err, data) {
                if (err) {
                    res.status(401).json({ success: false, msg: err, uri: "" });
                } else {
                    res.status(200).json({ success: true, msg: "Login Success", userInfo: data });
                }
            });
        } else {
            console.log("local login")
            Auth.Login(username, password, function (err, data) {
                if (err) {
                    res.status(401).json({ success: false, msg: err, uri: "" });
                } else {
                    res.status(200).json({ success: true, msg: "Login Success", userInfo: data });
                }
            });
        }
    } else {
        res.status(401).json({ success: false, msg: "Please enter username and password" });
    }
});

router.get('/checkAuthMethod', (req, res, next) => {
    res.status(200).json({ success: true, data: Config.getConfig.config.authMethod })
})


router.post("/tfa", Auth.IsAuthenticatedTotp, (req, res, next) => {
    if (req.body.token) {

        console.log("Validate:");
        Tfa.Validate(req.body.token, req.body.uid, (err, data) => {
            if (err) {
                console.log("Validate err:" + err);
                res.status(400).json(err);
            } else {
                //console.log("IsAuthenticatedTotp:" + JSON.stringify(data));
                res.status(200).json({ success: true, msg: "Login Success", userInfo: data });
            }
        })
    } else {
        res.status(400).json({});
    }
})

module.exports = router;
let express = require("express");
let router = express.Router();
let Install = require("../controller/install");
let User = require("../controller/user");


router.get("/", function (req, res, next) {
    User.CheckAdmin(function (data) {
        console.log("router CheckADmins" + data);
        if (data) {
            res.redirect('/');
        } else {
            res.render('install', { title: "DriveNode 2.0", msg: " ", submitBtn: true, success: false });
        }
    })
});

router.post("/", function (req, res, next) {
    Install.Init(req.body.password, req.body.confirmPassword, req.body.email, function (err, data) {
        if (err) {
            res.status(400).json({ success: false, msg: err });
            //res.render('install', { title: "DriveNode 2.0", msg: err, submitBtn: true, success: false });

        } else {
            res.status(201).json({ success: true, msg: "Administartor account created" });
            //res.render('install', { title: "DriveNode 2.0", msg: "Administartor account created", submitBtn: false, success: true });
        }
    })
});

router.get("/check", (req, res, next) => {
    Install.CheckInit((err, data) => {
        if (err) {
            res.status(400).json({ success: false, msg: err });
        } else {
            res.status(200).json(data)
        }
    })
})


module.exports = router;
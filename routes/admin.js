var express = require("express");
var router = express.Router();
var token = require("../controller/token");
var Auth = require("../controller/auth");
var Group = require("../controller/group");
var User = require("../controller/user");
var Token = require("../controller/token");
var Admin = require("../controller/admin");
var Config = require("../controller/config");
var Ad = require("../controller/ad");

router.use(Auth.SetPermission({ listUser: true }));
router.get("/user", Auth.CheckPermission, function (req, res, next) {
  var json = {};
  json.scope = req.query.scope;
  json.token = req.query.token;

  User.ListUser(json, function (err, data) {
    if (err) {
      res.status(401).json({ success: false, msg: err.msg });
    } else {
      res.status(201).json({ success: true, msg: "", data: data });
    }
  });
});

router.use(Auth.SetPermission({ listUser: true }));
router.get("/user/:uid", Auth.CheckPermission, function (req, res, next) {
  User.ListUserDetail(req.params.uid, (err, data) => {
    if (err) {
      res.status(401).json({ success: false, msg: err });
    } else {
      res.status(200).json({ success: true, msg: "", data: data });
    }
  });
});

router.use(Auth.SetPermission({ createUser: true }));
router.post("/user", Auth.CheckPermission, function (req, res, next) {
  //create user
  var json = {};
  json.username = req.body.username;
  json.password = req.body.password;
  json.confirmPwd = req.body.confirmPwd;
  json.email = req.body.email;
  json.group = req.body.group;
  json.name = req.body.name;
  json.space = req.body.space; //MB
  json.activate = req.body.activate;

  User.CreateUser(json, function (err, data) {
    if (err) {
      res.status(401).json({ success: false, msg: err.msg, uri: "/api/user" });
    } else {
      res.status(201).json({ success: true, msg: data.msg, uri: "/api/user" });
    }
  });
});

router.use(Auth.SetPermission({ createUser: true }));
router.put('/user/:uid', Auth.CheckPermission, (req, res, next) => {
  User.EditUser(req.params.uid, req.body.email, req.body.group, req.body.name, req.body.activate, (err, data) => {
    if (err) {
      res.status(400).json({ success: false, msg: err, data: "" });
    } else {
      res.status(201).json({ success: true, msg: data, data: "" })
    }
  })
})

router.use(Auth.SetPermission({ createGroup: true }));
router.get("/group", Auth.CheckPermission, function (req, res, next) {
  Token.VerifyToken(req.query.token, function (err, data) {
    if (err) {
      res.status(401).json({ success: false, msg: err });
    } else {
      if (data.group.groupName == "admin") {
        Group.ListGroup("all", function (err, data) {
          if (err) {
            res.status(401).json({ success: false, msg: err });
          } else {
            res.status(200).json({ success: true, msg: "Success", data: data });
          }
        });
      } else {
        Group.ListGroup(data.group.groupName, function (err, data) {
          if (err) {
            res.status(401).json({ success: false, msg: err });
          } else {
            res.status(200).json({ success: true, msg: "Success", data: data });
          }
        });
      }
    }
  });
});

router.use(Auth.SetPermission({ createGroup: true }));
router.get("/group/:groupId", Auth.CheckPermission, (req, res, next) => {
  Group.ListOneGroup(req.params.groupId, (err, data) => {
    if (err) {
      res.status(400).json({ success: false, msg: err, err: err });
    } else {
      res.status(200).json({ success: true, msg: "Group Listed", data: data });
    }
  });
});

router.use(Auth.SetPermission({ createGroup: true }));
router.post("/group", Auth.CheckPermission, function (req, res, next) {
  //create group
  var permission = {};
  var files = {};
  var dir = {};
  var name = req.body.name;
  var defaultStorage = req.body.defaultStorage;
  dir.list = req.body.dirList;
  dir.create = req.body.dirCreate;
  dir.delete = req.body.dirDelete;
  files.upload = req.body.fileUpload;
  files.list = req.body.fileList;
  files.delete = req.body.fileDelete;
  permission.createUser = req.body.createUser;
  permission.createGroup = req.body.createGroup;
  permission.listUser = req.body.listUser;
  permission.dir = dir;
  permission.files = files;

  Group.CreateGroup(name, permission, defaultStorage, function (err, data) {
    if (err) {
      res.status(401).json({ success: false, msg: err.msg });
    } else {
      res.status(201).json({ success: true, msg: data.msg });
    }
  });
});

router.use(Auth.SetPermission({ createGroup: true }));
router.put("/group/:groupId", Auth.CheckPermission, function (req, res, next) {
  //create group
  var permission = {};
  var files = {};
  var dir = {};
  var name = req.body.name;
  if (req.body.name == "admin") {
    res.status(400).json({ success: false, msg: "Unable to edit admin group" });
  } else {
    var defaultStorage = req.body.defaultStorage;
    dir.list = req.body.dirList;
    dir.create = req.body.dirCreate;
    dir.delete = req.body.dirDelete;
    files.upload = req.body.fileUpload;
    files.list = req.body.fileList;
    files.delete = req.body.fileDelete;
    permission.createUser = req.body.createUser;
    permission.createGroup = req.body.createGroup;
    permission.listUser = req.body.listUser;
    permission.dir = dir;
    permission.files = files;

    Group.EditGroup(
      req.params.groupId,
      name,
      permission,
      defaultStorage,
      function (err, data) {
        if (err) {
          res.status(400).json({ success: false, msg: err.msg });
        } else {
          res.status(201).json({ success: true, msg: data.msg });
        }
      }
    );
  }
});

router.use(Auth.SetPermission({ createGroup: true }));
router.post("/config", Auth.CheckPermission, (req, res, next) => {
  Config.SetConfig(req.body.config).then((data) => {
    res.status(201).json({ success: true, msg: "" });
  }).catch((err) => {
    res.status(400).json({ success: false, msg: err });
  })
})

router.use(Auth.SetPermission({ createGroup: true }));
router.get("/config", (req, res, next) => {
  res.status(200).json({ success: true, config: Config.getConfig.config });
})

//router.use(Auth.SetPermission({listUser:true}));
router.get("/count/:object/", (req, res, next) => {
  if (req.params.object == "user") {
  }
  Admin.AdminCount(req.params.object, (err, data) => {
    if (err) {
      res.status(400).json({ success: false, msg: err });
    } else {
      res.status(200).json({ success: true, msg: "", data: data });
    }
  });
});

router.use(Auth.SetPermission({ createGroup: true }));
router.get("/ad/user", Auth.CheckPermission, (req, res, next) => {
  Ad.ListUser((err, data) => {
    if (err) {
      res.status(400).json({ success: false, msg: err });
    } else {
      res.status(200).json({ success: true, msg: "", data: data });
    }
  })
})

module.exports = router;

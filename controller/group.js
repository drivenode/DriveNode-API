const mongoose = require("mongoose");
const async = require("async");
const Db = require("../db");
const Group = mongoose.model("group");
const dbHelper = require("./dbHelper");

var createGroup = function(name, permission, defaultStorage, next) {
  if (name && permission) {
    const fileUpload = permission.files.upload;
    const fileList = permission.files.list;
    const fileDel = permission.files.delete;
    const dirCreate = permission.dir.create;
    const dirList = permission.dir.list;
    const dirDel = permission.dir.delete;
    const createUser = permission.createUser;
    const createGroup = permission.createGroup;
    const listUser = permission.listUser;
    const groupName = name;

    const json = {
      groupName: groupName,
      files: permission.files,
      dir: permission.dir,
      changePwd: true,
      createUser: createUser,
      createGroup: createGroup,
      listUser: listUser,
      defaultStorage: defaultStorage
    };

    dbHelper.Count("group", { groupName: groupName }, (err, count) => {
      if (count > 0) {
        next({ msg: "Group Name existed" }, null);
      } else {
        dbHelper.Add("group", json, function(err, data) {
          if (err) {
            next({ msg: err }, null);
          } else {
            next(null, { msg: data });
          }
        });
      }
    });
  } else {
    next({ msg: "Empty value" }, null);
  }
};

var checkGroup = function(cb) {
  Group.findOne({ groupName: "admin" }, "_id groupName", function(err, data) {
    if (data === null) {
      console.log("findone" + data);
      createInitialGroup(function(err, data) {
        console.log("find_id" + data);
        cb(err, data._id);
      });
    } else {
      cb(null, data._id);
    }
  });
};

var createInitialGroup = function(next) {
  const permission = {};
  permission.files = { upload: true, list: true, delete: true };
  permission.dir = { create: true, list: true, delete: true };
  permission.createUser = true;
  permission.createGroup = true;
  permission.listUser = true;

  createGroup("admin", permission, "0", function(err, data) {
    next(err, data.msg);
  });
};

var listGroup = function(scope, next) {
  if (scope == "all") {
    Group.find({}, "_id groupName", function(err, data) {
      next(err, data);
    });
  } else {
    Group.find({ groupName: scope }, "_id groupName", function(err, data) {
      next(err, data);
    });
  }
};

var listOneGroup = (id, next) => {
  if (id) {
    dbHelper.List("group", { _id: id }, null, null, null, true, (err, data) => {
      next(err, data);
    });
  }
};

var editGroup = (id, name, permission, defaultStorage, next) => {
  if (id) {
    if (name && permission) {
      const fileUpload = permission.files.upload;
      const fileList = permission.files.list;
      const fileDel = permission.files.delete;
      const dirCreate = permission.dir.create;
      const dirList = permission.dir.list;
      const dirDel = permission.dir.delete;
      const createUser = permission.createUser;
      const createGroup = permission.createGroup;
      const listUser = permission.listUser;
      const groupName = name;

      const json = {
        groupName: groupName,
        files: permission.files,
        dir: permission.dir,
        changePwd: true,
        createUser: createUser,
        createGroup: createGroup,
        listUser: listUser,
        defaultStorage: defaultStorage
      };

      dbHelper.Count("group", { groupName: groupName }, (err, count) => {
        if (count > 0) {
          dbHelper.List(
            "group",
            { groupName: groupName },
            "_id groupName",
            null,
            null,
            true,
            (err, listCount) => {
              if (err) {
              } else {
                if (listCount._id == id) {
                  dbHelper.Update("group", { _id: id }, json, (err, data) => {
                    next(err, data);
                  });
                } else {
                  next({ msg: "Group existed already" }, null);
                }
              }
            }
          );
        } else {
          dbHelper.Update("group", { _id: id }, json, (err, data) => {
            next(err, data);
          });
        }
      });
    } else {
      next({ msg: "Empty value" }, null);
    }
  } else [next("Empty Group ID", null)];
};

module.exports.CreateGroup = createGroup;
module.exports.CreateInitialGroup = createInitialGroup;
module.exports.CheckGroup = checkGroup;
module.exports.ListGroup = listGroup;
module.exports.ListOneGroup = listOneGroup;
module.exports.EditGroup = editGroup;

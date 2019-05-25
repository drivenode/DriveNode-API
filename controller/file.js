var dbHelper = require("../controller/dbHelper");
var FileAES = require("../security/fileAES");
var config = require("./config");
var fs = require("fs");
var async = require("async");

var fileAdd = (fileInfo, dir, uid, next) => {
  var json = {};
  console.log(fileInfo);
  json.filename = fileInfo.filename;
  json.realname = fileInfo.originalname;
  json.mimetype = fileInfo.mimetype;
  json.size = fileInfo.size; //fileInfo size in bytes
  json.dir = dir;
  json.key = "";
  json.owner = uid;
  json.share = { isShare: false };

  FileAES.Encrypt(
    config.getConfig.config.uploadTempPath,
    json.filename,
    function (err, data) {
      if (data && data.key) {
        json.key = data.key;
        dbHelper.Add("file", json, function (err, data) {
          next(err, data);
        });
      } else {
        next(err, null);
      }
    }
  );
};

var fileGet = (uid, fileId, res, next) => {
  var json = {};
  json.owner = uid;
  json._id = fileId;
  dbHelper.List(
    "file",
    json,
    "filename realname key mimetype",
    "dir",
    "dirName parentDir owner _id",
    false,
    function (err, data) {
      if (err) {
        next(err, null);
      } else if (data.length > 0) {
        var fileInfo = data[0];
        FileAES.Decrypt(fileInfo.filename, fileInfo.key, config.getConfig.config.fileDecrypt, function (err, data) {
          if (err) {
            next(err, null);
          } else {
            console.log("file:" + fileInfo)
            //next(null,{success:true,msg:"file decrypted",data:{path:config.getConfig.config.fileDecrypt,filename:fileInfo.filename,realname:fileInfo.realname}});
            if (fs.existsSync(config.getConfig.config.fileDecrypt + "/" + fileInfo.filename)) {
              res.writeHead(200, { "Content-Type": fileInfo.mimetype, "Content-Disposition": "attachment; filename=" + fileInfo.realname + "" });
              fs.createReadStream(config.getConfig.config.fileDecrypt + "/" + fileInfo.filename).pipe(res);
              res.on("finish", function () {
                if (fs.existsSync(config.getConfig.config.fileDecrypt + "/" + fileInfo.filename)) {
                  fs.unlinkSync(config.getConfig.config.fileDecrypt + "/" + fileInfo.filename);
                }
              });
            } else {
              next("File does not exist", null);
            }
          }
        });
      } else {
        next("file does not exist", null);
      }
    }
  );
};

var fileList = (uid, dir, next) => {
  let json = {};
  json.owner = uid;
  console.log("dir" + dir);
  if (dir && dir.length > 0) {
    json.dir = dir;
  } else {
    json.dir = null;
  }
  console.log(json);
  dbHelper.List(
    "file",
    json,
    null,
    "dir",
    "dirName parentDir owner _id",
    null,
    function (err, data) {
      next(err, data);
    }
  );
};

var fileInfo = (uid, fileId, next) => {
  if (fileId) {
    let json = {};
    json.owner = uid;
    json._id = fileId;
    dbHelper.List(
      "file",
      json,
      "_id realname mimetype size owner createDate",
      "dir",
      "dirName parentDir owner _id",
      true,
      function (err, data) {
        next(err, data);
      }
    );
  } else {
  }
};

var fileRename = (uid, newname, fileId, next) => {
  let query = { _id: fileId, owner: uid };
  let json = {};

  json.updateDate = Date.now();
  dbHelper.List("file", query, "_id realname", null, null, true, function (
    err,
    data
  ) {
    if (err) {
      next(err, null);
    } else if (data && data.realname) {
      let oldRealname = data.realname;
      let arr = oldRealname.split(".");
      let fileExtension = arr[arr.length - 1];
      if (typeof fileExtension != "undefined") {
        json.realname = newname + "." + fileExtension;
      } else {
        json.realname = newname;
      }
      dbHelper.Update("file", query, json, function (err, data) {
        if (err) {
          next(err, null);
        } else if (data && data.ok) {
          next(null, { realname: json.realname });
        } else {
          next(data, null);
        }
      });
    } else {
      next("File not found", null);
    }
  });
};

var fileDelete = (uid, fileId, next) => {
  let json = {};
  json.owner = uid;
  json._id = fileId;
  dbHelper.List("file", json, "_id filename", null, null, true, function (
    err,
    data
  ) {
    if (err) {
      next(err, null);
    } else if (data && data.filename) {
      deleteFile(data.filename, function (err, data) {
        if (err) {
          next(err, null);
        } else {
          dbHelper.Delete("file", json, function (err, data) {
            next(err, data);
          });
        }
      });
    } else {
      next("File not found", null);
    }
  });
};

var deleteFile = (filename, next) => {
  if (fs.existsSync(config.getConfig.config.filesPath + "/" + filename)) {
    fs.unlink(config.getConfig.config.filesPath + "/" + filename, function (
      err
    ) {
      if (err) {
        next(err, null);
      } else {
        next(null, "deleted");
      }
    });
  } else {
    next("File not found", null);
  }
};

var availableSpaceMiddleware = (req, res, next) => {
  if (req.userId) {
    async.waterfall(
      [
        function (cb) {
          dbHelper.List(
            "user",
            { _id: req.userId },
            "_id username email group",
            "group",
            "_id defaultStorage",
            true,
            function (err, data) {
              if (err) {
                cb(err, null);
              } else if (data && data.username) {
                cb(null, data);
              } else {
                cb("user not found", null);
              }
            }
          );
        },
        function (data, cb) {
          if (data && data.username && data.group) {
            var groupId = data.group._id;
            var defaultStorage = data.group.defaultStorage;
            var usedSize = 0;
            dbHelper.List(
              "file",
              { owner: req.userId },
              "size",
              null,
              null,
              false,
              function (err, data) {
                if (err) {
                  cb(err, null);
                } else if (data && data.length > 0) {
                  for (var i = 0; i < data.length; i++) {
                    usedSize = usedSize + data[i].size;
                  }
                  console.log("usedSize:" + usedSize);
                  cb(null, { totalSize: defaultStorage, usedSize: usedSize });
                } else {
                  cb(null, { totalSize: defaultStorage, usedSize: usedSize });
                }
              }
            );
          } else {
            cb("Invalid", null);
          }
        },
        function (data, cb) {
          console.log("data+a:" + JSON.stringify(data));
          if (data && data.totalSize != null) {
            if (data.totalSize != 0) {
              var avasize = data.totalSize - data.usedSize;
              var fileSize = req.file.size;
              if (fileSize > avasize) {
                cb(null, {
                  allowUpload: false,
                  fileSize: fileSize,
                  availableSpace: avasize,
                  totalSpace: data.totalSize
                });
              } else {
                cb(null, {
                  allowUpload: true,
                  fileSize: fileSize,
                  availableSpace: avasize,
                  totalSpace: data.totalSize
                });
              }
            } else {
              cb(null, {
                allowUpload: true,
                fileSize: fileSize,
                availableSpace: 0,
                totalSpace: 0
              });
            }
          } else {
            cb("Error DataSize", null);
          }
        }
      ],
      function (err, data) {
        if (data && data.allowUpload === true) {
          return next();
        } else if (data && data.allowUpload === false) {
          if (
            fs.existsSync(
              config.getConfig.config.uploadTempPath + "/" + req.file.filename
            )
          ) {
            fs.unlink(
              config.getConfig.config.uploadTempPath + "/" + req.file.filename
            );
          }
          res
            .status(400)
            .json({ success: false, msg: "Not enough space", data: data });
        } else {
          res.status(400).json({ success: false, msg: err });
        }
      }
    );
  } else {
    res.status(401).json({ success: false, msg: "Invalid User ID" });
  }
};

var fileSizeConverter = (fromSize, targetUnit, cb) => {
  if (fromSize && targetUnit) {
    switch (targetUnit) {
      case "KB":
        cb(null, fromSize / 1000);
        break;
      case "MB":
        cb(null, fromSize / 1000 / 1000);
        break;
      case "GB":
        cb(null, fromSize / 1000 / 1000 / 1000);
        break;
      case "TB":
        cb(null, fromSize / 1000 / 1000 / 1000 / 1000);
        break;
    }
  } else {
    cb("NaN", null);
  }
};

var getDecryptFilePathById = async (uid, fileId, next) => {
  var json = {};
  json._id = fileId;
  json.owner = uid;
  async.waterfall([
    (cb) => {  //validation
      if (fileId) {
        dbHelper.List("file", json, "filename realname key", null, null, false, (err, data) => {
          if (err) {
            cb(err, null)
          } else {
            if (data) {
              cb(null, data);
            } else {
              cb("File not found", null)
            }
          }
        })
      } else {
        cb("No File ID", null);
      }
    },
    (res, cb) => {
      if (res.length > 0) {
        var fileInfo = res[0];
        FileAES.DecryptFileCompress(fileInfo.filename, fileInfo.key, function (err, dataDecrypt) {
          if (err) {
            cb(err, null);
          } else {
            if (fs.existsSync(config.getConfig.config.fileCompressDecrypt + "/" + fileInfo.filename)) {
              let json = {};
              json.path = config.getConfig.config.fileCompressDecrypt + "/" + fileInfo.filename;
              json.fileName = fileInfo.realname
              cb(null, json);
            } else {
              cb("File does not exist", null);
            }
          }
        });
      } else {
        console.log("Fail Get File from DB");
        cb("File does not exist", null);
      }
    }
  ], (err, data) => {
    if (err) {
      console.log("File not found")
      next("File not Found", null)
    } else {
      next(null, data)
    }
  })
};

var getFilePreview = (uid, fileId, next) => {
  async.waterfall([
    cb => {
      if (uid) {
        let json = {};
        json._id = fileId;
        json.owner = uid;
        dbHelper.List('file', json, '_id filename mimetype size key', null, null, true, (err, data) => {
          console.log(data);
          cb(err, data)
        })
      } else {
        cb("Invalid User ID", null);
      }
    },
    (data, cb) => {
      if (data && data.filename) {
        fs.exists(config.getConfig.config.filesPath + "/" + data.filename, (res) => {
          if (res) {
            cb(null, data)
          } else {
            cb("File not exist", null)
          }
        })
      } else {
        cb("File not found", null)
      }
    },
    (data, cb) => {
      FileAES.Decrypt(data.filename, data.key, config.getConfig.config.streamTempPath, (err, result) => {
        if (result) {

          cb(null, data);
        } else {
          cb(err, null);
        }
      })
    }
  ], (err, data) => {
    if (err) {
      next(err, null);
    } else {
      //let json = {};
      //json.path = config.getConfig.config.streamTempPath + "/" + data.filename;
      //json.file = data;
      next(null, data);
    }

  })

}

module.exports.FileAdd = fileAdd;
module.exports.FileList = fileList;
module.exports.FileGet = fileGet;
module.exports.FileRename = fileRename;
module.exports.FileDelete = fileDelete;
module.exports.AvailableSpace = availableSpaceMiddleware;
module.exports.FileInfo = fileInfo;
module.exports.GetFilePathById = getDecryptFilePathById;
module.exports.GetFilePreview = getFilePreview;
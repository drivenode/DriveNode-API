let fs = require("fs");
var confFile = "./config/config.json";
var config = {};
let dbHelper = require("../controller/dbHelper.js")

var Configuration = function (cb) {
    fs.exists(confFile, function (data) {
        if (data) {
            var configFile = fs.readFileSync(confFile);
            config.error = false;
            config.config = JSON.parse(configFile);
            console.log(config);
            checkDirectories();
            cb(config);
        } else {
            config.error = true;
            cb(config);
        }
    });
}

var checkDirectories = (next) => {
    var arr = [];
    arr.push(config.config.uploadTempPath);
    arr.push(config.config.filesPath)
    arr.push(config.config.fileDecrypt)
    arr.push(config.config.backlistLog)
    arr.push(config.config.errorLog)
    arr.push(config.config.otherLog)
    arr.push(config.config.mailLog)
    arr.push(config.config.streamTempPath)
    arr.push(config.config.fileCompressDecrypt)
    arr.push(config.config.fileCompress)
    for (var i = 0; i < arr.length; i++) {
        let tmpDirPath = arr[i].split("/");
        //console.log("tmpDirPath:" + tmpDirPath[i]);
        let currDir = "";
        for (let a = 0; a < tmpDirPath.length; a++) {
            if (currDir != "") {
                currDir = currDir + "/" + tmpDirPath[a];
            } else {
                currDir = tmpDirPath[a];
            }
            if (!fs.existsSync(currDir)) {
                fs.mkdir(currDir, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Directory created! (" + currDir + ")")
                    }
                });
            }
        }
    }
};

async function setConfig(json) {
    fs.exists(config, (data) => {
        if (data) {
            json = JSON.stringify(json);
            fs.writeFileSync(config, json);
        }
    })
}

let readConfigFromDb = (key, next) => {
    dbHelper.List("config", { key: key }, null, null, null, false, (err, data) => {
        if (err) {
            next(err, null);
        } else {
            next(null, data)
        }
    })
}



module.exports.Config = Configuration;
module.exports.getConfig = config;
module.exports.CkDir = checkDirectories;
module.exports.SetConfig = setConfig;
module.exports.ReadConfigFromDb = readConfigFromDb;
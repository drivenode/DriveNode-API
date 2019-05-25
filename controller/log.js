const fs = require("fs");
const config = require("./config");
const async = require('async')
const common = require("./common")
let filename = "";
let type = "";

var jsonLogFile = (payload, fileType, cb) => {
    type = fileType;
    async.waterfall([
        cb => {
            getFilePath(data => {
                if (data) {
                    cb(null, data)
                } else {
                    cb("Error", null)
                }
            })
        }, (data, cb) => {
            fs.exists(data, fsres => {
                if (fsres) {
                    cb(null, data);
                } else {
                    cb("error", null)
                }
            })
        }, (data, cb) => {
            payload = payload + " " + common.GetDateTime() + " \n"
            fs.appendFile(data, payload, err => {
                if (err) {
                    writeErrorLog(err, (error, data) => {
                        console.log(error + data);
                        cb(error, null)
                    })
                } else {
                    console.log("Log Wrote")
                    cb(null, "Log Wrote")
                }
            })
        }

    ], (err, data) => {
        console.log("jsonLogFile: " + err + data);
    })
}

async function jsonLogFileAsync(payload, fileType) {
    type = fileType;
    async.waterfall([
        cb => {
            getFilePath(data => {
                if (data) {
                    cb(null, data)
                } else {
                    cb("Error", null)
                }
            })
        }, (data, cb) => {
            fs.exists(data, fsres => {
                if (fsres) {
                    cb(null, data);
                } else {
                    cb("error", null)
                }
            })
        }, (data, cb) => {
            payload = payload + " " + common.GetDateTime() + " \n"
            fs.appendFile(data, payload, err => {
                if (err) {
                    writeErrorLog(err, (error, data) => {
                        console.log(error + data);
                        cb(error, null)
                    })
                } else {
                    console.log("Log Wrote")
                    cb(null, "Log Wrote")
                }
            })
        }

    ], (err, data) => {
        console.log("jsonLogFile: " + err + data);
    })
}

var writeErrorLog = (payload, cb) => {
    type = "error";
    getFilePath(data => {
        if (data) {
            fs.exists(data, fsres => {
                if (fsres) {
                    fs.appendFile(data, payload, err => {
                        console.log(err);
                    })
                } else {
                    cb("error", null)
                }
            })
        }
    })
}

var getFilePath = (cb) => {
    switch (type) {
        case 'blacklist':
            filename = config.getConfig.config.backlistLog + "/" + type + "-" + common.GetDateTime(true) + ".txt";
            break;
        case 'error':
            filename = config.getConfig.config.errorLog + "/" + type + "-" + common.getDateTime(true) + ".txt";
            break;
        case 'mail':
            filename = config.getConfig.config.mailLog + "/" + type + "-" + common.getDateTime(true) + ".txt";
            break;
        default:
            filename = config.getConfig.config.otherLog + "/" + type + "-" + common.getDateTime(true) + ".txt";
            break;
    }
    if (fs.existsSync(filename)) {
        cb(filename)
    } else {
        fs.createWriteStream(filename);
        cb(filename)
    }
}

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + month + day;

}

module.exports.JsonLogFile = jsonLogFile
module.exports.jsonLogFileAsync = jsonLogFileAsync;
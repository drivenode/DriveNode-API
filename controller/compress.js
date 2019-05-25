const fs = require("fs");
const archiver = require("archiver");
const async = require("async");
const config = require("./config");
const File = require("./file");
const uuidv4 = require('uuid/v4');



var compress = (uid = "", files = [], name = "", type = "zip", next) => {
  var archive = archiver(type, {
    zlib: { level: 9 } // Sets the compression level.
  });
  var hasInvalidFile = false;
  var outputPath = config.getConfig.config.fileCompress + "/" + uuidv4() + ".zip";

  archive.on("warning", function (err) {
    if (err.code === "ENOENT") {
      // log warning
    } else {
      // throw error
      throw err;
    }
  });

  archive.on("error", function (err) {
    throw err;
  });

  var arrDir = new Array();
  async.waterfall(
    [
      cb => {
        if (files.length <= 0) {
          cb("No File selected", null);
        } else if (uid.length <= 0) {
          cb("No User ID provide", null);
        }
        else {
          cb(null, true);
        }
      },
      (result, cb) => {
        if (result) {

          let counter = 0;
          for (var i = 0; i < files.length; i++) {
            File.GetFilePathById(uid, files[i], async (err, data) => {
              if (err) {
                console.log("GetFilePathById:" + err)
                archive.abort();
                hasInvalidFile = true
                cb("File not found", null)
              } else {
                var json = data;
                arrDir.push(json);
                counter++;
                if (counter == files.length) {
                  return cb(null, arrDir);
                }
              }
            });
          }
        } else {
          cb("No File selected", null);
        }
      },
      (result, cb) => {
        if (result.length > 0) {
          var output = fs.createWriteStream(outputPath);
          archive.pipe(output);
          output.on("close", function () {
            if (hasInvalidFile) {
              cb("Fail", null)
            } else {
              deleteDecompress(result)
              var jsonRes = {};
              if (name.length <= 0) {
                name = "download.zip"
              } else {
                name = name + ".zip"
              }
              jsonRes.filename = name;
              jsonRes.path = outputPath;
              cb(null, jsonRes);
            }

          });

          // This event is fired when the data source is drained no matter what was the data source.
          // It is not part of this library but rather from the NodeJS Stream API.
          // @see: https://nodejs.org/api/stream.html#stream_event_end
          output.on("end", function () {
            console.log("Data has been drained");
            cb("Data has been drained", null);
          });

          var count = 0;
          for (var i = 0; i < result.length; i++) {
            json = result[i]
            archive.file(json.path, { name: json.fileName });
            count++
            if (count == result.length) {
              archive.finalize();
            }
          }
        } else {
          cb("Error", null)
        }
      }
    ],
    (err, data) => {

      next(err, data);
    }
  );
};

var compressUpload = (fileIds, cb) => {

}

var deleteDecompress = (array = []) => {
  for (var i = 0; i < array.length; i++) {
    if (fs.existsSync(array[i].path)) {
      fs.unlinkSync(array[i].path)
    } else {
      console.log("Cannot find file to delete")
    }
  }
}

module.exports.Compress = compress;
